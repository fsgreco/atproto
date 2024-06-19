import fs from 'node:fs/promises'
import * as ui8 from 'uint8arrays'
import { SeedClient, TestNetworkNoAppView, basicSeed } from '@atproto/dev-env'
import { AppContext, Recoverer } from '../dist'
import AtpAgent from '@atproto/api'
import { rmIfExists, renameIfExists } from '@atproto/common'
import { verifyRepoCar } from '@atproto/repo'

describe('recovery', () => {
  let network: TestNetworkNoAppView
  let ctx: AppContext
  let sc: SeedClient
  let agent: AtpAgent
  let alice: string
  let bob: string

  beforeAll(async () => {
    network = await TestNetworkNoAppView.create({
      dbPostgresSchema: 'recovery',
    })
    ctx = network.pds.ctx
    sc = network.getSeedClient()
    agent = network.pds.getClient()
    await basicSeed(sc)
    alice = sc.dids.alice
    bob = sc.dids.bob
    await network.processAll()
  })

  afterAll(async () => {
    await network.close()
  })

  const getStats = (did: string) => {
    return ctx.actorStore.read(did, async (store) => {
      const recordCount = await store.record.recordCount()
      const root = await store.repo.storage.getRootDetailed()
      return {
        recordCount,
        rev: root.rev,
        commit: root.cid,
      }
    })
  }

  const getRev = (did: string) => {
    return ctx.actorStore.read(did, async (store) => {
      const root = await store.repo.storage.getRootDetailed()
      return root.rev
    })
  }

  const getCar = async (did: string, since?: string) => {
    const res = await agent.api.com.atproto.sync.getRepo({
      did,
      since,
    })
    return res.data
  }

  const backup = async (dids: string[]) => {
    for (const did of dids) {
      const { dbLocation, keyLocation } = await ctx.actorStore.getLocation(did)
      await fs.copyFile(dbLocation, `${dbLocation}-backup`)
      await fs.copyFile(keyLocation, `${keyLocation}-backup`)
    }
  }

  const restore = async (dids: string[]) => {
    for (const did of dids) {
      const { dbLocation, keyLocation } = await ctx.actorStore.getLocation(did)
      await rmIfExists(dbLocation)
      await rmIfExists(keyLocation)
      await renameIfExists(`${dbLocation}-backup`, dbLocation)
      await renameIfExists(`${keyLocation}-backup`, keyLocation)
    }
  }

  it('recovers repos based on the sequencer ', async () => {
    // backup alice & bob
    await backup([alice, bob])

    // grab rev times from intermediate repo states
    // process a bunch of record creates, updates, and delets for alice
    const startRev = await getRev(alice)
    let middleRev = ''
    for (let i = 0; i < 100; i++) {
      if (i === 0) {
        middleRev = await getRev(alice)
      }
      const ref = await sc.post(alice, `post-${i}`)
      if (i % 20 === 0) {
        await sc.updateProfile(alice, { displayName: `name-${i}` })
      }
      if (i % 10 === 0) {
        await sc.deletePost(alice, ref.ref.uri)
      } else {
        await sc.like(alice, ref.ref)
      }
    }

    // delete bob's account
    const deleteToken = await ctx.accountManager.createEmailToken(
      bob,
      'delete_account',
    )
    await agent.com.atproto.server.deleteAccount({
      token: deleteToken,
      did: bob,
      password: sc.accounts[bob].password,
    })

    // create a new account (elli)
    await sc.createAccount('elli', {
      handle: 'elli.test',
      password: 'elli-pass',
      email: 'elli@test.com',
    })
    const elli = sc.dids.elli
    for (let i = 0; i < 10; i++) {
      await sc.post(elli, `post-${i}`)
    }
    // get some stats & snapshots from before we do a recovery
    const endRev = await getRev(alice)
    const startCarBefore = await getCar(alice, startRev)
    const middleCarBefore = await getCar(alice, middleRev)
    const endCarBefore = await getCar(alice, endRev)
    const elliStatsBefore = await getStats(elli)

    // "restore" all 3 accounts to their backedup state, effectively rolling back the previous mutations
    // deleting alice's mutations, restoring bob's account, and deleting elli's account
    await restore([alice, bob, elli])

    // run recovery operation
    const recover = new Recoverer(network.pds.ctx, {
      cursor: 0,
      concurrency: 10,
    })
    await recover.run()

    // ensure alice's CAR is exactly the same as before the loss, including intermediate states based on tracked revs
    const startCarAfter = await getCar(alice, startRev)
    const middleCarAfter = await getCar(alice, middleRev)
    const endCarAfter = await getCar(alice, endRev)
    expect(ui8.equals(startCarAfter, startCarBefore)).toBe(true)
    expect(ui8.equals(middleCarAfter, middleCarBefore)).toBe(true)
    expect(ui8.equals(endCarAfter, endCarBefore)).toBe(true)

    // ensure bob's account is re-deleted
    const attempt = getCar(bob)
    await expect(attempt).rejects.toThrow(/Could not find repo for DID/)
    const bobExists = await ctx.actorStore.exists(bob)
    expect(bobExists).toBe(false)

    // ensure elli's account is restored
    // this involves creating a new signing key for her and updating her DID document
    const elliStatsAfter = await getStats(elli)
    const elliCar = await getCar(elli)
    expect(elliStatsAfter.recordCount).toEqual(elliStatsBefore.recordCount)
    expect(elliStatsAfter.rev).toEqual(elliStatsBefore.rev)
    const elliKey = await ctx.actorStore.keypair(elli)
    const verified = await verifyRepoCar(elliCar, elli, elliKey.did())
    expect(verified.creates.length).toEqual(elliStatsBefore.recordCount)
  })
})

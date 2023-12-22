import AtpAgent from '@atproto/api'
import { PrimaryDatabase } from '../db'
import { sql } from 'kysely'
import { dbLogger } from '../logger'
import { SECOND, wait } from '@atproto/common'

export class LabelSubscription {
  destroyed = false
  promise: Promise<void> = Promise.resolve()
  lastLabel: number | undefined

  constructor(public db: PrimaryDatabase, public labelAgent: AtpAgent) {}

  async start() {
    const res = await this.db.db
      .selectFrom('label')
      .select('cts')
      .orderBy('cts', 'desc')
      .limit(1)
      .executeTakeFirst()
    this.lastLabel = res ? new Date(res.cts).getTime() : undefined
    this.promise = this.poll()
  }

  async fetchLabels() {
    const res = await this.labelAgent.api.com.atproto.temp.fetchLabels({
      since: this.lastLabel,
    })
    const last = res.data.labels.at(-1)
    if (!last) {
      return
    }
    const dbVals = res.data.labels.map((l) => ({
      ...l,
      cid: l.cid ?? '',
      neg: l.neg ?? false,
    }))
    const { ref } = this.db.db.dynamic
    const excluded = (col: string) => ref(`excluded.${col}`)
    await this.db
      .asPrimary()
      .db.insertInto('label')
      .values(dbVals)
      .onConflict((oc) =>
        oc.columns(['src', 'uri', 'cid', 'val']).doUpdateSet({
          neg: sql`${excluded('neg')}`,
          cts: sql`${excluded('cts')}`,
        }),
      )
      .execute()
    this.lastLabel = new Date(last.cts).getTime()
  }

  async poll() {
    if (this.destroyed) return
    try {
      await this.fetchLabels()
    } catch (err) {
      dbLogger.error({ err }, 'failed to fetch and store labels')
    }
    await wait(SECOND)
    this.promise = this.poll()
  }

  async destroy() {
    this.destroyed = true
    await this.promise
  }
}

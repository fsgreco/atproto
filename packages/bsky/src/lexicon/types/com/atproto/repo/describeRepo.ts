/**
 * GENERATED CODE - DO NOT MODIFY
 */
import express from 'express'
import { ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { lexicons } from '../../../../lexicons.js'
import { isObj, hasProp } from '../../../../util.js'
import { HandlerAuth, HandlerPipeThrough } from '@atproto/xrpc-server'

export interface QueryParams {
  /** The handle or DID of the repo. */
  repo: string
}

export type InputSchema = undefined

export interface OutputSchema {
  handle: string
  did: string
  /** The complete DID document for this account. */
  didDoc: {}
  /** List of all the collections (NSIDs) for which this repo contains at least one record. */
  collections: string[]
  /** Indicates if handle is currently valid (resolves bi-directionally) */
  handleIsCorrect: boolean
  [k: string]: unknown
}

export type HandlerInput = undefined

export interface HandlerSuccess {
  encoding: 'application/json'
  body: OutputSchema
  headers?: { [key: string]: string }
}

export interface HandlerError {
  status: number
  message?: string
}

export type HandlerOutput = HandlerError | HandlerSuccess | HandlerPipeThrough
export type HandlerReqCtx<HA extends HandlerAuth = never> = {
  auth: HA
  params: QueryParams
  input: HandlerInput
  req: express.Request
  res: express.Response
}
export type Handler<HA extends HandlerAuth = never> = (
  ctx: HandlerReqCtx<HA>,
) => Promise<HandlerOutput> | HandlerOutput

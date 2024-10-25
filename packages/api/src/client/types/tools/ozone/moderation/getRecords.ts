/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { HeadersMap, XRPCError } from '@atproto/xrpc'
import { ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { isObj, hasProp } from '../../../../util.js'
import { lexicons } from '../../../../lexicons.js'
import * as ToolsOzoneModerationDefs from './defs.js'

export interface QueryParams {
  uris: string[]
}

export type InputSchema = undefined

export interface OutputSchema {
  records: (
    | ToolsOzoneModerationDefs.RecordViewDetail
    | ToolsOzoneModerationDefs.RecordViewNotFound
    | { $type: string; [k: string]: unknown }
  )[]
  [k: string]: unknown
}

export interface CallOptions {
  signal?: AbortSignal
  headers?: HeadersMap
}

export interface Response {
  success: boolean
  headers: HeadersMap
  data: OutputSchema
}

export function toKnownErr(e: any) {
  return e
}

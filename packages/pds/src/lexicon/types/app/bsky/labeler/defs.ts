/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { lexicons } from '../../../../lexicons.js'
import { isObj, hasProp } from '../../../../util.js'
import * as AppBskyActorDefs from '../actor/defs.js'
import * as ComAtprotoLabelDefs from '../../../com/atproto/label/defs.js'

export interface LabelerView {
  uri: string
  cid: string
  creator: AppBskyActorDefs.ProfileView
  likeCount?: number
  viewer?: LabelerViewerState
  indexedAt: string
  labels?: ComAtprotoLabelDefs.Label[]
  [k: string]: unknown
}

export function isLabelerView(v: unknown): v is LabelerView {
  return (
    isObj(v) &&
    hasProp(v, '$type') &&
    v.$type === 'app.bsky.labeler.defs#labelerView'
  )
}

export function validateLabelerView(v: unknown): ValidationResult {
  return lexicons.validate('app.bsky.labeler.defs#labelerView', v)
}

export interface LabelerViewDetailed {
  uri: string
  cid: string
  creator: AppBskyActorDefs.ProfileView
  policies: LabelerPolicies
  likeCount?: number
  viewer?: LabelerViewerState
  indexedAt: string
  labels?: ComAtprotoLabelDefs.Label[]
  [k: string]: unknown
}

export function isLabelerViewDetailed(v: unknown): v is LabelerViewDetailed {
  return (
    isObj(v) &&
    hasProp(v, '$type') &&
    v.$type === 'app.bsky.labeler.defs#labelerViewDetailed'
  )
}

export function validateLabelerViewDetailed(v: unknown): ValidationResult {
  return lexicons.validate('app.bsky.labeler.defs#labelerViewDetailed', v)
}

export interface LabelerViewerState {
  like?: string
  [k: string]: unknown
}

export function isLabelerViewerState(v: unknown): v is LabelerViewerState {
  return (
    isObj(v) &&
    hasProp(v, '$type') &&
    v.$type === 'app.bsky.labeler.defs#labelerViewerState'
  )
}

export function validateLabelerViewerState(v: unknown): ValidationResult {
  return lexicons.validate('app.bsky.labeler.defs#labelerViewerState', v)
}

export interface LabelerPolicies {
  /** The label values which this labeler publishes. May include global or custom labels. */
  labelValues: ComAtprotoLabelDefs.LabelValue[]
  /** Label values created by this labeler and scoped exclusively to it. Labels defined here will override global label definitions for this labeler. */
  labelValueDefinitions?: ComAtprotoLabelDefs.LabelValueDefinition[]
  [k: string]: unknown
}

export function isLabelerPolicies(v: unknown): v is LabelerPolicies {
  return (
    isObj(v) &&
    hasProp(v, '$type') &&
    v.$type === 'app.bsky.labeler.defs#labelerPolicies'
  )
}

export function validateLabelerPolicies(v: unknown): ValidationResult {
  return lexicons.validate('app.bsky.labeler.defs#labelerPolicies', v)
}

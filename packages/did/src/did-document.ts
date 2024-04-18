import { jwkSchema } from '@atproto-labs/jwk'
import { z } from 'zod'

import { Did, didSchema } from './did.js'

/**
 * RFC3968 compliant URI
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc3986}
 */
export const rfc3968UriSchema = z.string().refine((data) => {
  try {
    new URL(data)
    return true
  } catch {
    return false
  }
})

export const didControllerSchema = z.union([didSchema, z.array(didSchema)])

/**
 * @note this schema might be too permissive
 */
export const didRelativeUriSchema = z.union([
  rfc3968UriSchema,
  z.string().regex(/^#[^#]+$/),
])

export const didVerificationMethodSchema = z.object({
  id: didRelativeUriSchema,
  type: z.string().min(1),
  controller: didControllerSchema,
  publicKeyJwk: jwkSchema.optional(),
  publicKeyMultibase: z.string().optional(),
})

/**
 * The value of the id property MUST be a URI conforming to [RFC3986]. A
 * conforming producer MUST NOT produce multiple service entries with the same
 * id. A conforming consumer MUST produce an error if it detects multiple
 * service entries with the same id.
 *
 * @note Normally, only rfc3968UriSchema should be allowed here. However, the
 *   did:plc uses relative URI. For this reason, we also allow relative URIs
 *   here.
 */
export const didServiceIdSchema = didRelativeUriSchema

/**
 * The value of the type property MUST be a string or a set of strings. In order
 * to maximize interoperability, the service type and its associated properties
 * SHOULD be registered in the DID Specification Registries
 * [DID-SPEC-REGISTRIES].
 */
export const didServiceTypeSchema = z.union([z.string(), z.array(z.string())])

/**
 * The value of the serviceEndpoint property MUST be a string, a map, or a set
 * composed of one or more strings and/or maps. All string values MUST be valid
 * URIs conforming to [RFC3986] and normalized according to the Normalization
 * and Comparison rules in RFC3986 and to any normalization rules in its
 * applicable URI scheme specification.
 */
export const didServiceEndpointSchema = z.union([
  rfc3968UriSchema,
  z.record(z.string(), rfc3968UriSchema),
  z.array(z.union([rfc3968UriSchema, z.record(z.string(), rfc3968UriSchema)])),
])

/**
 * Each service map MUST contain id, type, and serviceEndpoint properties.
 * @see {@link https://www.w3.org/TR/did-core/#services}
 */
export const didServiceSchema = z.object({
  id: didServiceIdSchema,
  type: didServiceTypeSchema,
  serviceEndpoint: didServiceEndpointSchema,
})

export type DidService = z.infer<typeof didServiceSchema>

export const didAuthenticationSchema = z.union([
  //
  didRelativeUriSchema,
  didVerificationMethodSchema,
])

/**
 * @note This schema is incomplete
 * @see {@link https://www.w3.org/TR/did-core/#production-0}
 */
export const didDocumentSchema = z.object({
  '@context': z.union([
    z.literal('https://www.w3.org/ns/did/v1'),
    z
      .array(z.string().url())
      .nonempty()
      .refine((data) => data[0] === 'https://www.w3.org/ns/did/v1'),
  ]),
  id: didSchema,
  controller: didControllerSchema.optional(),
  alsoKnownAs: z.array(rfc3968UriSchema).optional(),
  service: z.array(didServiceSchema).optional(),
  authentication: z.array(didAuthenticationSchema).optional(),
  verificationMethod: z
    .array(z.union([didVerificationMethodSchema, didRelativeUriSchema]))
    .optional(),
})

export type DidDocument<Method extends string = string> = z.infer<
  typeof didDocumentSchema
> & { id: Did<Method> }

export const didDocumentValidator = didDocumentSchema.refinement(
  (data) =>
    !data.service?.some((s, i, a) => {
      for (let j = i + 1; j < a.length; j++) {
        if (s.id === a[j]!.id) return true
      }
      return false
    }),
  {
    code: z.ZodIssueCode.custom,
    message: 'Duplicate service id',
  },
)
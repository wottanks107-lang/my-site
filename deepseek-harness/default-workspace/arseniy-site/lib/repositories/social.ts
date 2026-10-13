// Публичные ссылки на соцсети.
import { createRepo } from './crud'
import type { SocialLink } from '../types'

const repo = createRepo<SocialLink>('social_links', { order: [{ column: 'sort_order' }] })

export const listSocialLinks = repo.list
export const listPublicSocialLinks = repo.listPublic
export const getSocialLink = repo.get
export const createSocialLink = repo.create
export const updateSocialLink = repo.update
export const removeSocialLink = repo.remove

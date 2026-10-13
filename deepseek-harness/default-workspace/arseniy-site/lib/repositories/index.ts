// Единая точка входа в данные.
//
// Правило проекта: компоненты и route handlers не обращаются к Supabase напрямую,
// только через эти репозитории. Тогда смена источника данных не задевает интерфейс.
//
//   import { listPublicProjects, createGoal } from '@/lib/repositories'
export * from './errors'
export * from './profiles'
export * from './settings'
export * from './social'
export * from './timeline'
export * from './skills'
export * from './projects'
export * from './books'
export * from './schedule'
export * from './homework'
export * from './notes'
export * from './goals'
export * from './workouts'
export * from './finance'
export * from './media'

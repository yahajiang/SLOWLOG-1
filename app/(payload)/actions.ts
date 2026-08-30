'use server'

import config from '@payload-config'
import { handleServerFunctions } from '@payloadcms/next/layouts'
import { importMap } from './admin/importMap.js'

export async function serverFunction(args: any) {
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

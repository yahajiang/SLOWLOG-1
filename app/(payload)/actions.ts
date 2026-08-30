'use server'

import config from '@payload-config'
import { handleServerFunctions } from '@payloadcms/next/layouts'
import { importMap } from './admin/importMap.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function serverFunction(args: any): Promise<any> {
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

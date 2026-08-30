'use server'

import config from '@payload-config'
import { handleServerFunctions } from '@payloadcms/next/layouts'
import { importMap } from './admin/importMap.js'

type ServerFunctionClientArgs = {
  name: string
  args: Record<string, unknown>
}

type ServerFunctionClient = (args: ServerFunctionClientArgs) => Promise<unknown>

export const serverFunction: ServerFunctionClient = async (args) => {
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

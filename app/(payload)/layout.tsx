import config from '@payload-config'
import '@payloadcms/next/css'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import { importMap } from './admin/importMap.js'
import './admin/custom.scss'

type Args = {
  children: React.ReactNode
}

// 创建 server action - 必须在模块级别定义
async function createServerFunction() {
  'use server'
  return async (args: any) => {
    return handleServerFunctions({
      ...args,
      config,
      importMap,
    })
  }
}

const serverFunction = await createServerFunction()

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout

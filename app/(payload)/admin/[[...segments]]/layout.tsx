import config from '@payload-config'
import '@payloadcms/next/css'
import '../custom.scss'
import React from 'react'
import { RootLayout } from '@payloadcms/next/layouts'
import { importMap } from '../importMap'

type Args = {
  children: React.ReactNode
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={async () => {}}>
    {children}
  </RootLayout>
)

export default Layout

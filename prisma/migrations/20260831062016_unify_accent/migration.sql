-- AlterTable
ALTER TABLE "public"."Post" ALTER COLUMN "pageConfig" SET DEFAULT '{"layout":"standard","theme":"light","primaryColor":"oklch(0.55 0.15 250)","fontFamily":"sans","backgroundColor":"#FFFFFF","maxWidth":"medium","showTOC":false}';

-- AlterTable
ALTER TABLE "public"."Setting" ALTER COLUMN "defaultPageConfig" SET DEFAULT '{"layout":"standard","theme":"light","primaryColor":"oklch(0.55 0.15 250)","fontFamily":"sans","backgroundColor":"#FFFFFF","maxWidth":"medium","showTOC":false}';

// 跨平台 bundle 分析启动器：ANALYZE=true next build
process.env.ANALYZE = "true";
import("next/dist/bin/next").then((m) => {
  process.argv[2] = "build";
  m.default(process.argv).catch((e) => { console.error(e); process.exit(1) });
});

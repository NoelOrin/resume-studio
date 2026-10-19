import type { ResumeData } from '../types'

/**
 * 示例内容（虚构人物）。数字类指标在文本中用 {花括号} 包裹，
 * 渲染时会变成蓝色等宽高亮，例如：日均 {1.2M} 单。
 */
export const defaultResume: ResumeData = {
  version: 2,
  templateId: 'industrial',
  theme: { accent: '#2F52E0' },
  flags: { showYears: true, showStats: true, showFlow: true },

  strip: {
    a: 'POLYMER TYPE-25A',
    b: 'ORBITAL STANDARD',
    rev: 'REV. 06',
    sheet: 'SHEET 01 / 01',
    date: '2026 — Q1',
  },

  header: {
    brand: 'LIN SYSTEMS',
    brandSub: 'FULL-STACK DIV.',
    nameZh: '林知远',
    nameEn: 'LIN ZHIYUAN',
    tag: 'RESUME / 2026',
    titleZh: '全栈开发工程师',
    titleEn: 'FULL-STACK DEVELOPER',
    status: ['SIX YEARS IN PRODUCTION', '上海 · SHANGHAI', 'REMOTE-READY'],
    years: { value: '06', label: 'YEARS' },
    contacts: [
      { label: 'MAIL', value: 'zhiyuan.lin@example.dev' },
      { label: 'TEL', value: '+86 138 0000 4821' },
      { label: 'SITE', value: 'zhiyuan.dev' },
      { label: 'GIT', value: 'github.com/zhiyuan-dev' },
    ],
  },

  profile: {
    no: '02',
    kicker: 'PROFILE / 个人简介',
    text: '六年全栈开发，交付过订单中台、实时数据管道与设计系统。擅长把复杂业务拆成可验证的小块，用类型系统与端到端测试守住边界；相信交付不是上线那一刻，而是三年后仍有人敢改。',
    stats: [
      { value: '06', label: 'YEARS' },
      { value: '24', label: 'REPOS' },
      { value: '03', label: 'TEAMS' },
    ],
  },

  stack: {
    no: '04',
    kicker: 'STACK / 技术栈',
    groups: [
      { k: 'LANG', v: 'TypeScript / Go / Python / SQL' },
      { k: 'FRONTEND', v: 'React / Next.js / Zustand' },
      { k: 'BACKEND', v: 'Node.js / NestJS / gRPC' },
      { k: 'DATA', v: 'PostgreSQL / Redis / ClickHouse' },
      { k: 'INFRA', v: 'Docker / K8s / AWS / Terraform' },
      { k: 'TOOL', v: 'Playwright / Vitest / pnpm' },
    ],
    skills: [
      { label: 'TS', level: 10 },
      { label: 'REACT', level: 9 },
      { label: 'NODE', level: 8 },
      { label: 'GO', level: 6 },
    ],
  },

  education: {
    no: '05',
    kicker: 'CREDENTIALS / 教育与证书',
    school: '同济大学',
    schoolMeta: 'TONGJI UNIVERSITY · B.ENG',
    date: '2014.09 — 2018.06',
    degree: '软件工程 · 工学学士 · 上海',
    items: [
      'AWS Certified Solutions Architect — Associate / 2024',
      'CKAD · Certified Kubernetes App Developer / 2023',
      '中文 Native · English CET-6 · 可英文技术评审',
    ],
  },

  experience: {
    no: '01',
    title: 'EXPERIENCE',
    zh: '工作经历',
    meta: '2018 — NOW · 3 POSTS',
    jobs: [
      {
        roleZh: '高级全栈工程师',
        roleEn: 'SENIOR FULL-STACK',
        company: 'ORBITAL SYSTEMS 星环科技 · 上海',
        date: '2022.06 — NOW',
        bullets: [
          '主导订单中台从单体到模块化拆分，日均 {1.2M} 单，P99 由 840ms 降至 {210ms}。',
          '设计 Kafka + ClickHouse 实时看板，支撑 40+ 运营指标秒级刷新，替代 T+1 报表。',
          '沉淀计价与履约领域模型、事件契约，跨团队联调成本下降 {60%}。',
          '搭建前端设计系统与 CI 流水线，需求交付周期从 3 周压缩到 {5 天}。',
          '带 4 人小组，负责技术评审、故障复盘与校招面试。',
        ],
      },
      {
        roleZh: '全栈工程师',
        roleEn: 'FULL-STACK',
        company: 'POLYMER LAB 聚合物实验室 · 杭州',
        date: '2019.07 — 2022.05',
        bullets: [
          '从 0 搭建 SaaS 多租户架构（NestJS + PostgreSQL RLS），服务 {1,800+} 企业租户。',
          '实现可配置表单引擎，业务方自助上线 300+ 流程，定制开发减少 {70%}。',
          '设计异步任务队列与重试策略，批处理吞吐提升 {3.2 倍}。',
          '引入 Playwright 端到端回归，发版验证从 2 天缩短到 40 分钟。',
        ],
      },
      {
        roleZh: '前端工程师',
        roleEn: 'FRONTEND',
        company: 'KAIWU STUDIO 开物工作室 · 上海',
        date: '2018.07 — 2019.06',
        bullets: [
          '独立交付 12 个品牌站点，Lighthouse 性能平均 {96} 分。',
          '维护开源组件库 EMULSION UI，累计 1.4k stars、周下载 8k。',
          '推动 CSS 变量与栅格规范，跨项目样式复用率达到 65%。',
        ],
      },
    ],
  },

  projects: {
    no: '03',
    title: 'SELECTED WORK',
    zh: '项目',
    meta: 'P-01 — P-04',
    items: [
      {
        name: 'EMULSION UI',
        code: 'P-01',
        kind: 'Open Source · Design System',
        desc: 'TypeScript + Vite 组件库，42 个可访问组件，配套 Token 与文档站。',
        stats: [
          { v: '1.4k', l: '★' },
          { v: '8k', l: '/WEEK' },
          { v: '42', l: 'COMP' },
        ],
      },
      {
        name: 'ORDER MESH',
        code: 'P-02',
        kind: 'Platform · Go / PostgreSQL',
        desc: '订单中台，事件驱动拆分 + 幂等网关，支撑大促峰值流量。',
        stats: [
          { v: '8k', l: 'QPS' },
          { v: '1.2M', l: '/DAY' },
          { v: '99.98%', l: '' },
        ],
      },
      {
        name: 'SIGNAL BOARD',
        code: 'P-03',
        kind: 'Realtime · Kafka / ClickHouse',
        desc: '运营实时看板，流批一体指标层，支持自定义维度下钻。',
        stats: [
          { v: '40', l: 'METRICS' },
          { v: '<2s', l: 'LATENCY' },
        ],
      },
      {
        name: 'TYPED PIPELINE',
        code: 'P-04',
        kind: 'Tooling · Codegen / CI',
        desc: '从 OpenAPI 生成类型、客户端与 Mock，内置契约测试。',
        stats: [
          { v: '-70%', l: 'BOILER' },
          { v: '31', l: 'SERVICES' },
        ],
      },
    ],
  },

  flow: {
    label: 'PROCESS',
    steps: ['DISCOVER', 'MODEL', 'BUILD', 'SHIP', 'MEASURE', 'MAINTAIN'],
    tag: 'R-25A / CYCLE 06',
  },

  footer: {
    product: 'PRODUCT NO. 6 · SPEC 25-A · SHEET 01 / 01',
    copyright: '© 2026 LIN ZHIYUAN · ALL SIGNALS NOMINAL',
    word: 'FULLSTACK',
    plateTop: 'LIN SYSTEMS',
    plateSub: 'FULL-STACK DIVISION · SHANGHAI · CN',
    code: 'ZX · 2026 · 06',
    sig: 'SIGNED\nBY HAND\nNO. 006',
    edgeL: 'FULL-STACK ENGINEER · SHANGHAI · CN',
    edgeR: 'RESUME · SPEC 25-A · 2026',
  },
}

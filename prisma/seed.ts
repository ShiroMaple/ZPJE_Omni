import { prisma } from '../lib/prisma';

const initialApps = [
    {
        key: 'CarbonPlatform',
        name: '能碳管理平台',
        description: '能碳管理平台',
        url: 'https://carbonplatform.izpje.com/',
        icon: 'Zap',
        sortOrder: 1,
        mainDeptId: '3903028799223120739', // 生产技术部
    },
    {
        key: 'FabFlow',
        name: '制造标准工期计算工具',
        description: '制造标准工期计算工具',
        url: 'https://fabflow.izpje.com/',
        icon: 'Calculator',
        sortOrder: 2,
        mainDeptId: '3903028799223120739', // 生产技术部
    },
    {
        key: 'supos_Kanban',
        name: 'SupOS数采看板',
        description: 'SupOS数采看板',
        url: 'https://suposdata.izpje.com/',
        icon: 'LayoutDashboard',
        sortOrder: 3,
        mainDeptId: '3903028799223120739', // 生产技术部
    },
    {
        key: 'DocEx',
        name: '智能结构化提取文档数据',
        description: '智能结构化提取文档数据',
        url: 'https://docex.izpje.com/',
        icon: 'FileText',
        sortOrder: 4,
        mainDeptId: '3874094900378814311', // 人力资源部
    },
    {
        key: 'WeldSnap',
        name: '管道焊接过程质量管理工具',
        description: '管道焊接过程质量管理工具',
        url: 'https://weldsnap.izpje.com/',
        icon: 'Activity',
        sortOrder: 5,
        mainDeptId: '1837058068862029671', // 安全环保部
    },
];

async function main() {
    console.log('开始写入预置应用数据...');
    for (const app of initialApps) {
        await prisma.app.upsert({
            where: { key: app.key },
            update: app,
            create: app,
        });
    }
    console.log('预置应用数据导入成功！');

    console.log('开始写入预置角色数据...');
    const roles = [
        { key: 'admin', name: '系统管理员' },
        { key: 'operator', name: '高级操作员' },
        { key: 'user', name: '普通员工' },
        { key: 'leader', name: '领导' }
    ];
    for (const role of roles) {
        await prisma.role.upsert({
            where: { key: role.key },
            update: { name: role.name },
            create: role,
        });
    }
    console.log('预置角色数据导入成功！');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
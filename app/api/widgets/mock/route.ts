import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key') || 'carbon';

  if (key === 'weldsnap') {
    return NextResponse.json({
      metrics: [
        { label: "当日检测管道数", value: "142 道", change: "+12.4%", trend: "up" },
        { label: "无损探伤合格率", value: "99.2%", change: "+0.1%", trend: "up" },
        { label: "待整改缺陷数", value: "3 处", change: "-50.0%", trend: "down" },
        { label: "在线焊接机台数", value: "24 台", change: "正常", trend: "stable" }
      ]
    });
  }

  // Default: carbon energy platform stats
  return NextResponse.json({
    metrics: [
      { label: "今日能耗总量", value: "12,450 kWh", change: "+4.2%", trend: "up" },
      { label: "碳排放总量", value: "3.2 吨", change: "-1.5%", trend: "down" },
      { label: "用电安全评级", value: "A 级", change: "优秀", trend: "stable" },
      { label: "节电目标达成率", value: "96.4%", change: "+2.1%", trend: "up" }
    ]
  });
}

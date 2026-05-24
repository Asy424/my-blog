export const metadata = {
  title: "关于",
  description: "关于我和这个博客",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">关于</h1>
      <div className="mt-8 prose">
        <p>
          你好！欢迎来到我的个人博客。这里是我记录技术探索、分享编程心得、沉淀思考收获的地方。
        </p>
        <h2>关于我</h2>
        <p>
          一名热爱技术的开发者，喜欢探索各种编程语言和框架，对前端、后端、系统设计都有浓厚的兴趣。
        </p>
        <h2>关于博客</h2>
        <p>
          这个博客使用 Next.js 构建，通过 Tailwind CSS 设计样式，部署在 GitHub Pages 上。
          所有文章以 Markdown 格式编写，源码托管在 GitHub 上。
        </p>
        <h2>联系方式</h2>
        <p>
          如果你有任何问题或建议，欢迎通过 GitHub Issues 与我联系。
        </p>
      </div>
    </div>
  );
}

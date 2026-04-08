import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

interface FeatureCardProps {
  to: string;
  icon: string;
  title: string;
  description: string;
  delay: string;
}

function FeatureCard({ to, icon, title, description, delay }: FeatureCardProps) {
  return (
    <Link to={to} className={styles.featureCard} style={{ animationDelay: delay }}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDesc}>{description}</p>
      <div className={styles.featureArrow}>→</div>
    </Link>
  );
}

function NeuralBackground() {
  return (
    <div className={styles.neuralBg}>
      <canvas id="neuralCanvas" className={styles.neuralCanvas} />
    </div>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title={siteConfig.title}
      description="由 Nous Research 构建的自我改进 AI 代理文档"
    >
      <NeuralBackground />

      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>自我改进 AI 代理</div>
            <h1 className={styles.heroTitle}>
              <span className={styles.titleLine}>Hermes</span>
              <span className={styles.titleLineAccent}>Agent</span>
            </h1>
            <p className={styles.heroSubtitle}>
              唯一具有内置学习循环的代理<br />
              <span className={styles.highlight}>从经验中创建技能</span> · <span className={styles.highlight}>在使用中完善技能</span> · <span className={styles.highlight}>跨会话建立认知</span>
            </p>
            <div className={styles.heroCta}>
              <Link to="/docs/getting-started/installation" className={styles.btnPrimary}>
                <span>开始使用</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link to="/docs/getting-started/quickstart" className={styles.btnSecondary}>
                快速入门
              </Link>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.orbContainer}>
              <div className={styles.orb} />
              <div className={styles.orbRing} />
              <div className={styles.orbRing2} />
              <div className={styles.orbGlow} />
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className={styles.features}>
          <h2 className={styles.sectionTitle}>核心能力</h2>
          <div className={styles.featureGrid}>
            <FeatureCard
              to="/docs/user-guide/features/skills"
              icon="⚡"
              title="技能系统"
              description="从经验中创建和完善技能，积累专业知识"
              delay="0ms"
            />
            <FeatureCard
              to="/docs/user-guide/features/memory"
              icon="🧠"
              title="持久记忆"
              description="跨会话记住用户偏好和上下文"
              delay="100ms"
            />
            <FeatureCard
              to="/docs/user-guide/features/mcp"
              icon="🔌"
              title="MCP 集成"
              description="连接任何 MCP 服务器，扩展无限可能"
              delay="200ms"
            />
            <FeatureCard
              to="/docs/user-guide/features/delegation"
              icon="👥"
              title="任务委托"
              description="将复杂任务分解并委托给子代理"
              delay="300ms"
            />
            <FeatureCard
              to="/docs/user-guide/features/cron"
              icon="⏰"
              title="定时任务"
              description="设置自动化工作流，主动执行任务"
              delay="400ms"
            />
            <FeatureCard
              to="/docs/user-guide/messaging"
              icon="💬"
              title="消息网关"
              description="通过 Telegram、Discord 等平台交互"
              delay="500ms"
            />
          </div>
        </section>

        {/* Stats Section */}
        <section className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>内置</span>
            <span className={styles.statLabel}>技能生态</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNumber}>多</span>
            <span className={styles.statLabel}>消息平台</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNumber}>自</span>
            <span className={styles.statLabel}>我改进循环</span>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <h2>准备好开始了吗？</h2>
            <p>在 60 秒内安装并体验您的第一个对话</p>
            <Link to="/docs/getting-started/installation" className={styles.ctaButton}>
              立即安装 →
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <span className={styles.footerLogo}>Hermes Agent</span>
              <span className={styles.footerTagline}>由 Nous Research 构建</span>
            </div>
            <div className={styles.footerLinks}>
              <a href="https://github.com/NousResearch/hermes-agent" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="/docs/getting-started/quickstart">文档</a>
              <a href="/docs/reference/faq">FAQ</a>
            </div>
          </div>
        </footer>
      </main>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const canvas = document.getElementById('neuralCanvas');
              const ctx = canvas.getContext('2d');
              let width, height;
              let particles = [];
              const particleCount = 80;
              const connectionDistance = 150;

              function resize() {
                width = canvas.width = window.innerWidth;
                height = canvas.height = window.innerHeight;
              }

              function createParticle() {
                return {
                  x: Math.random() * width,
                  y: Math.random() * height,
                  vx: (Math.random() - 0.5) * 0.5,
                  vy: (Math.random() - 0.5) * 0.5,
                  radius: Math.random() * 2 + 1,
                  opacity: Math.random() * 0.5 + 0.2
                };
              }

              function init() {
                resize();
                particles = [];
                for (let i = 0; i < particleCount; i++) {
                  particles.push(createParticle());
                }
              }

              function animate() {
                ctx.clearRect(0, 0, width, height);

                particles.forEach((p, i) => {
                  p.x += p.vx;
                  p.y += p.vy;

                  if (p.x < 0 || p.x > width) p.vx *= -1;
                  if (p.y < 0 || p.y > height) p.vy *= -1;

                  ctx.beginPath();
                  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                  ctx.fillStyle = 'rgba(34, 211, 238, ' + p.opacity + ')';
                  ctx.fill();

                  particles.slice(i + 1).forEach(p2 => {
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < connectionDistance) {
                      ctx.beginPath();
                      ctx.moveTo(p.x, p.y);
                      ctx.lineTo(p2.x, p2.y);
                      ctx.strokeStyle = 'rgba(34, 211, 238, ' + (0.15 * (1 - dist / connectionDistance)) + ')';
                      ctx.lineWidth = 0.5;
                      ctx.stroke();
                    }
                  });
                });

                requestAnimationFrame(animate);
              }

              window.addEventListener('resize', resize);
              init();
              animate();
            })();
          `
        }}
      />
    </Layout>
  );
}

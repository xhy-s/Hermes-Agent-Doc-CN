import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/">
            开始使用文档
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="由 Nous Research 构建的自我改进 AI 代理文档">
      <HomepageHeader />
      <main>
        <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>
          <p>
            Hermes Agent 是一个具有内置学习循环的自主 AI 代理。
            它能够从经验中创建技能、在使用中不断完善技能、推动自身保存知识。
          </p>
        </div>
      </main>
    </Layout>
  );
}

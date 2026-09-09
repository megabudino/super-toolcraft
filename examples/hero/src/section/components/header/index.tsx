import { withBasePath } from "@/section/shared/config/base-path";
import styles from './recraft-header.module.css';

const resources = [
  { label: 'API', href: 'https://www.recraft.ai/docs/api-reference/getting-started' },
  { label: 'Docs', href: 'https://www.recraft.ai/docs/recraft-models/recraft-v4-styles' },
] as const;
const studioUrl = 'https://www.recraft.ai/auth/login?callbackUrl=%2F';

/** Original website guest header, rendered inside the standalone canvas viewport. */
export default function RecraftHeader() {
  return (
    <header className={styles.header} data-recraft-header>
      <div className={styles.inner}>
        <a className={styles.logo} href="https://www.recraft.ai/">
          <img className={styles.logoImage} src={withBasePath("/logo-mark.svg")} alt="Recraft" width={40} height={40} />
        </a>
        <nav aria-label="Recraft resources" className={styles.resources}>
          {resources.map(link => (
            <a className={styles.resource} href={link.href} key={link.href}>{link.label}</a>
          ))}
        </nav>
        <div className={styles.actions}>
          <a className={`${styles.action} ${styles.signIn}`} href={studioUrl}>
            <span>Sign in</span>
          </a>
          <a className={`${styles.action} ${styles.studio}`} href={studioUrl} data-recraft-studio-link>
            <span>Try Recraft Studio</span>
          </a>
        </div>
      </div>
    </header>
  );
}

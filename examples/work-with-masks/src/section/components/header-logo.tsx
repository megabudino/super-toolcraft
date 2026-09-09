import foldStudioLogo from '@/section/assets/fold-studio-logo.svg';
import styles from './header-logo.module.css';

export function HeaderLogo() {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={styles.logo}
      draggable={false}
      height={68}
      src={foldStudioLogo}
      width={337}
    />
  );
}

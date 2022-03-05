import Link from 'next/link';
import styles from './styles.module.scss';

export default function PreviewButton(): JSX.Element {
  return (
    <div className={styles.button}>
      <Link href="/api/exit-preview">
        <a>Sair do modo Preview</a>
      </Link>
    </div>
  );
}

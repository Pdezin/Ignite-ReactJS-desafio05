import { useEffect } from 'react';
import styles from '../../styles/common.module.scss';

export default function Comments(): JSX.Element {
  useEffect(() => {
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-comments-for-uterances');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('repo', 'Pdezin/Ignite-ReactJS-desafio05');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'dark-blue');
    script.setAttribute('async', 'true');
    anchor.appendChild(script);
  }, []);

  return <div id="inject-comments-for-uterances" />;
}

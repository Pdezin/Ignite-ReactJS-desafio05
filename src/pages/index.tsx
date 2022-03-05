import { GetStaticProps } from 'next';

import Link from 'next/link';
import Prismic from '@prismicio/client';
import { FiUser, FiCalendar } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<PostPagination>(() => postsPagination);

  async function getMorePosts(): Promise<void> {
    if (!posts.next_page) return;

    await fetch(postsPagination.next_page)
      .then(data => data.json())
      .then(response => {
        setPosts(prev => {
          return {
            next_page: response.next_page,
            results: [...prev.results, ...response.results],
          };
        });
      });
  }

  return (
    <main className={commonStyles.content}>
      <div className={styles.logo}>
        <img src="/Logo.svg" alt="logo" />
      </div>
      <div className={styles.posts}>
        {posts.results.map(post => (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <a>
              <strong>{post.data.title}</strong>
              <p>{post.data.subtitle}</p>
              <div>
                <FiCalendar />
                <time>
                  {format(new Date(post.first_publication_date), 'PP', {
                    locale: ptBR,
                  })}
                </time>
                <FiUser />
                <span>{post.data.author}</span>
              </div>
            </a>
          </Link>
        ))}
      </div>
      {posts.next_page !== null && (
        <button
          onClick={() => getMorePosts()}
          type="button"
          className={styles.loadMore}
        >
          Carregar mais posts
        </button>
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  return {
    props: {
      postsPagination: postsResponse,
    },
    revalidate: 120, // 2 minutes
  };
};

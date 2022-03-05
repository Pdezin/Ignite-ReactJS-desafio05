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
import PreviewButton from '../components/PreviewButton';

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
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<PostPagination>(postsPagination);

  async function getMorePosts(): Promise<void> {
    if (!posts.next_page) return;

    await fetch(posts.next_page)
      .then(data => data.json())
      .then(response => {
        setPosts(prev => {
          return {
            results: [...prev.results, ...response.results],
            next_page: response.next_page,
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
      {preview && <PreviewButton />}
    </main>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 5,
      orderings: '[document.first_publication_date desc]',
      ref: previewData?.ref ?? null,
    }
  );

  return {
    props: {
      postsPagination: postsResponse,
      preview,
    },
    revalidate: 120, // 2 minutes
  };
};

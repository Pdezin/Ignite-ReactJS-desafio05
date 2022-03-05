import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const [publication, setPublication] = useState<Post>(post);
  const router = useRouter();

  const readingTime = publication.data.content.reduce((acc, cur) => {
    return acc + Math.ceil(RichText.asText(cur.body).split(' ').length / 200);
  }, 0);

  if (router.isFallback) {
    return <p>Carregando...</p>;
  }

  return (
    <>
      <Header />
      {publication?.data && (
        <main>
          <div
            className={styles.banner}
            style={{ backgroundImage: `url(${publication.data.banner.url})` }}
          />
          <article>
            <div className={`${commonStyles.content} ${styles.post}`}>
              <div className={styles.postHead}>
                <h1>{publication.data.title}</h1>
                <div>
                  <FiCalendar />
                  <time>
                    {format(
                      new Date(publication.first_publication_date),
                      'PP',
                      {
                        locale: ptBR,
                      }
                    )}
                  </time>
                  <FiUser />
                  <span>{publication.data.author}</span>
                  <FiClock />
                  <span>{readingTime} min</span>
                </div>
              </div>
              {publication.data.content.map((content, i) => (
                <div className={styles.postBody} key={content.heading}>
                  <h2>{content.heading}</h2>
                  {content.body.map(body => (
                    <p key={body.text}>{body.text}</p>
                  ))}
                </div>
              ))}
            </div>
          </article>
        </main>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.slug'],
      pageSize: 1,
    }
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const post = await prismic.getByUID('posts', String(slug), {});

  return {
    props: {
      post,
    },
    revalidate: 60 * 3, // 3 minutes
  };
};

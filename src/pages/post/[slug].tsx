import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import Link from 'next/link';
import { setTimeout } from 'timers';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Comments from '../../components/Comments';
import PreviewButton from '../../components/PreviewButton';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  preview: boolean;
  nextPost: {
    data: {
      title: string;
    };
    uid: string;
  };
  prevPost: {
    data: {
      title: string;
    };
    uid: string;
  };
}

export default function Post({
  post,
  preview,
  nextPost,
  prevPost,
}: PostProps): JSX.Element {
  const [publication, setPublication] = useState<Post>(post);
  const [next, setNext] = useState(nextPost);
  const [prev, setPrev] = useState(prevPost);
  const router = useRouter();

  const readingTime = publication?.data.content.reduce((acc, cur) => {
    return acc + Math.ceil(RichText.asText(cur.body).split(' ').length / 200);
  }, 0);

  if (router.isFallback) {
    return <p>Carregando...</p>;
  }

  function getPrevPost(): void {
    router.push(`/post/${prev.uid}`).then(() => router.reload());
  }

  function getNextPost(): void {
    router.push(`/post/${next.uid}`).then(() => router.reload());
  }

  return (
    <>
      <Header />
      {publication?.data && (
        <main>
          <img
            className={styles.banner}
            alt="banner"
            src={publication.data.banner.url}
          />
          <article className={commonStyles.content}>
            <div className={styles.post}>
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
                <time>
                  * editado em{' '}
                  {format(new Date(publication.last_publication_date), 'PPPp', {
                    locale: ptBR,
                  })}
                </time>
              </div>
              {publication.data.content.map(content => (
                <div className={styles.postBody} key={content.heading}>
                  <h2>{content.heading}</h2>
                  {content.body.map(body => (
                    <p key={body.text}>{body.text}</p>
                  ))}
                </div>
              ))}
            </div>
            <div className={styles.divider} />
            <div className={styles.nextPrevPost}>
              <div>
                {prev && (
                  <>
                    <p>{prev.data.title}</p>
                    <button onClick={() => getPrevPost()} type="button">
                      Post anterior
                    </button>
                  </>
                )}
              </div>
              <div>
                {next && (
                  <>
                    <p>{next.data.title}</p>
                    <button onClick={() => getNextPost()} type="button">
                      Próximo post
                    </button>
                  </>
                )}
              </div>
            </div>
            <Comments />
            {preview && <PreviewButton />}
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

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const post = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const prevPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: `${post.id}`,
      orderings: '[document.first_publication_date]',
    })
  ).results[0];

  const nextPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: `${post.id}`,
      orderings: '[document.first_publication_date desc]',
    })
  ).results[0];

  return {
    props: {
      post,
      preview,
      prevPost: prevPost ?? null,
      nextPost: nextPost ?? null,
    },
    revalidate: 60 * 3, // 3 minutes
  };
};

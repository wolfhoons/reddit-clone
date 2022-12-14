import type { NextPage } from "next";
import Link from "next/link";
import styles from "../styles/Home.module.css";
import useSWR from "swr";
import { Post, Sub } from "../types";
import axios from "axios";
import Image from "next/image";
import { useAuthState } from "../context/auth";
import useSWRInfinite from 'swr/infinite';
import PostCard from "../components/PostCard";
import { useEffect, useState } from "react";

const Home: NextPage = () => {
  const { authenticated } = useAuthState();
  const fetcher = async (url: string) => {
    return await axios.get(url).then((res) => res.data);
  };
  const address = "http://localhost:4000/api/subs/sub/topSubs";

  const getKey = (pageIndex: number, previousPageData: Post[]) => {
    if(previousPageData && !previousPageData.length) return null;
    return `/posts?page=${pageIndex}`;
  }

  const { data, error, size: page, setSize: setPage, isValidating, mutate} = useSWRInfinite<Post[]>(getKey);
  const { data: topSubs } = useSWR<Sub[]>(address, fetcher);

  const isInitialLoading = !data && !error;
  const posts: Post[] = data ? ([] as Post[]).concat(...data) : [];

  // 스크롤 내려서 observedPost 에 닿으면
  // 다음 페이지 포스트들을 가져오기 윟나 포스트 Id
  const [observedPost, setObserverdPost] = useState('');

  const observeElement = (element: HTMLElement | null) => {
    if(!element) return;
    console.log('observe')
    const observer = new IntersectionObserver((entries) => {
      // isIntersecting: 관찰 대상 교차 상태 (boolean)
      if(entries[0].isIntersecting === true) {
        console.log('마지막 포스트에 도달')
        setPage(page+ 1);
        observer.unobserve(element);
      }
      // 옵저버가 실행되기 위해 타겟 가시성이 얼마나 필요한지의 백분율
    }, { threshold: 1})
    observer.observe(element)
  }
  // Infinite Scroll
  useEffect(() => {
    if (!posts || posts.length === 0) return;
    const id = posts[posts.length - 1].identifier;

    if(id !== observedPost) {
      setObserverdPost(id);
      observeElement(document.getElementById(id));
    }
  }, [posts]);


  return (
    <div className="flex max-w-5xl px-4 pt-5 mx-auto">
      {/* 포스트 목록 */}
      <div className="w-full md:mr-3 md:w-8/12">
        <div className="w-9/12">
          {isInitialLoading && <p className="text-lg text-center">Loading..</p>}
          {
            posts?.map((post) => (
              <PostCard post={post} key={post.identifier} mutate={mutate}/>
            ))
          }
        </div>
      </div>
      {/* 사이드 바 */}
      <div className="hidden w-4/12 ml-3 md:block">
        <div className="bg-white border rounded">
          <div className="p-4 border-b">
            <p className="text-lg font-semibold text-center">상위 커뮤니티</p>
          </div>
          {/* 커뮤니티 목록 */}
          <div>
            {topSubs?.map((sub) => (
              <div
                key={sub.name}
                className="flex items-center px-4 py-2 text-xs border-b"
              >
                <Link href={`/r/${sub.name}`}>
                  <a>
                    <Image
                      src={sub.imageUrl}
                      className="rounded-full cursor-pointer"
                      alt="sub"
                      width={24}
                      height={24}
                    />
                  </a>
                </Link>
                <Link href={`/r/${sub.name}`}>
                  <a className="ml-2 font-bold hover:cursor-pointer">
                    /r/{sub.name}
                  </a>
                </Link>
                <p className="ml-auto font-medium">{sub.postCount}</p>
              </div>
            ))}
          </div>
          { authenticated &&
            <div className="w-full py-6 text-center">
              <Link href="/subs/create">
                <a className="w-full p-2 text-center text-white bg-gray-400 rounded">
                  커뮤니티 만들기
                </a>
              </Link>
            </div>
          }
        </div>
      </div>
    </div>
  );
};

export default Home;

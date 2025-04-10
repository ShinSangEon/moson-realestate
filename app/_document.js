import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        <script
          src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=8e0ddadeec988e4dd5b6d246b48ff9c3&libraries=services,clusterer"
          defer
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

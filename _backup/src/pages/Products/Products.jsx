import Header from '../../components/Header/Header.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import '../placeholder.css';

export default function Products() {
  return (
    <>
      <Header />
      <main className="placeholder-page">
        <h1 className="display-1">케어 제품</h1>
        <p className="body">내 식물에 맞는 흙과 영양제를 고르거나, 재료를 직접 섞어 나만의 흙을 만들어 보세요.</p>
        <p className="placeholder-page__note">이 페이지는 아직 만들고 있어요.</p>
      </main>
      <Footer />
    </>
  );
}

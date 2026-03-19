import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import ProductSection from "@/components/ProductSection";
import NewsBanner from "@/components/NewsBanner";
import PromoBanner from "@/components/PromoBanner";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { fetchNewsBanners, fetchPopularProducts } from "@/api/products";

const Index = () => {
  const bannersQuery = useQuery({
    queryKey: ["products", "news-banners"],
    queryFn: fetchNewsBanners,
    staleTime: 2000,
    retry: 1,
    refetchOnWindowFocus: true,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  });

  const popularQuery = useQuery({
    queryKey: ["products", "popular"],
    queryFn: fetchPopularProducts,
    staleTime: 2000,
    retry: 1,
    refetchOnWindowFocus: true,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  });

  return (
    <div className="min-h-screen flex flex-col paper-bg">
      <Header />

      <main className="flex-1">
        <PromoBanner />
        <CategoryNav />
        <NewsBanner
          products={bannersQuery.data ?? []}
          isLoading={bannersQuery.isLoading}
          isError={bannersQuery.isError}
        />
        <ProductSection
          title="Mais Vendidos"
          products={popularQuery.data ?? []}
          isLoading={popularQuery.isLoading}
          isError={popularQuery.isError}
          emptyMessage="Sem produtos populares no momento."
          errorMessage="Não foi possível carregar os mais vendidos."
        />
      </main>

      <Footer />
    </div>
  );
};

export default Index;

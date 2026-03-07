import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import ProductSection from "@/components/ProductSection";
import NewsBanner from "@/components/NewsBanner";
import PromoBanner from "@/components/PromoBanner";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { fetchFeaturedProducts, fetchPopularProducts } from "@/api/products";

const Index = () => {
  const location = useLocation();
  const featuredQuery = useQuery({
    queryKey: ["products", "featured"],
    queryFn: fetchFeaturedProducts,
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
          products={featuredQuery.data ?? []}
          isLoading={featuredQuery.isLoading}
          isError={featuredQuery.isError}
        />
        <ProductSection
          key={`popular-${location.key}`}
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

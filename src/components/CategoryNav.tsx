import { Cigarette, Coffee, Filter, Flame, Package, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  { name: "Sedas", icon: Cigarette, href: "/categoria/sedas" },
  { name: "Piteiras", icon: Filter, href: "/categoria/piteira" },
  { name: "Fumigenos", icon: Flame, href: "/categoria/fumigenos" },
  { name: "Cuias", icon: Coffee, href: "/categoria/cuia" },
  { name: "BacaKits", icon: Package, href: "/categoria/bacakits" },
  { name: "Acessorios", icon: Sparkles, href: "/categoria/acessorios" },
];

const CategoryNav = () => {
  return (
    <section className="py-4 sm:py-6 md:py-8 lg:py-10 px-3 sm:px-4">
      <div className="max-w-5xl mx-auto">
        <div className="-mx-1 overflow-x-auto pb-2 md:mx-0 md:overflow-visible md:pb-0">
          <div className="flex min-w-max items-start gap-2.5 px-1 sm:gap-3 md:min-w-0 md:flex-wrap md:justify-center md:gap-6 lg:gap-8">
          {categories.map((category) => (
            <Link
              key={category.name}
              to={category.href}
                className="group flex w-[76px] shrink-0 flex-col items-center gap-1.5 sm:w-[84px] md:w-auto md:shrink md:gap-2"
            >
              <div className="category-circle h-11 w-11 sm:h-[3.25rem] sm:w-[3.25rem] md:h-16 md:w-16 lg:h-18 lg:w-18">
                  <category.icon className="h-[18px] w-[18px] text-primary transition-colors group-hover:text-accent sm:h-[22px] sm:w-[22px] md:h-7 md:w-7" />
              </div>
                <span className="text-center text-[10px] font-medium text-foreground/80 transition-colors group-hover:text-accent sm:text-[11px] md:text-sm">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto mt-6 sm:mt-8">
        <div className="h-px bg-border/60" />
      </div>
    </section>
  );
};

export default CategoryNav;

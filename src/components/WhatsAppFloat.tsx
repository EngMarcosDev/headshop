import { MessageCircle } from "lucide-react";

const WhatsAppFloat = () => {
  return (
    <a
      href="https://wa.me/5581981705445"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale no WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
      style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
    >
      <MessageCircle className="h-7 w-7 fill-white text-white" />
      <span
        className="absolute inset-0 rounded-full animate-ping opacity-25"
        style={{ backgroundColor: "#25D366" }}
      />
    </a>
  );
};

export default WhatsAppFloat;

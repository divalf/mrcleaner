import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MousePointer2, ChevronRight, X, ArrowRight, ShieldCheck, Leaf, CreditCard, Sparkles, UploadCloud, MapPin, CheckCircle2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// ========================
// CORE UI COMPONENTS
// ========================
const MagneticButton = ({ children, onClick, className = "", color = "accent" }) => {
  const bgColor = color === "accent" ? "bg-accent" : "bg-primary";
  const hoverColor = color === "accent" ? "bg-[#159eb9]" : "bg-[#e5927e]";

  return (
    <button 
      onClick={onClick}
      className={`relative overflow-hidden magnetic-btn rounded-full px-8 py-4 text-white font-heading font-semibold text-sm uppercase tracking-widest ${bgColor} ${className}`}
    >
      <span className={`absolute inset-0 btn-fill-bg ${hoverColor} z-0`}></span>
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};

// ========================
// MODAL FORMS
// ========================
// ⚙️ Cole aqui a URL do seu Google Apps Script Web App após a configuração:
const APPS_SCRIPT_URL = import.meta.env.VITE_SHEETS_WEBHOOK_URL || '';

const BudgetModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState(null);
  const [isSending, setIsSending] = useState(false);
  
  // Data state
  const [formData, setFormData] = useState({
    // Tapete
    tapeteLength: '', tapeteWidth: '', tapeteThickness: '',
    // Estofado
    estofadoType: '', estofadoSeats: '',
    // Colchao
    colchaoType: '', colchaoSize: '',
    // Generics
    cep: '', photo: null,
    // Contact
    firstName: '', lastName: '', email: '', whatsapp: ''
  });

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  // ── Máscaras de input ──────────────────────────────────────────
  const maskCep = (val) => {
    const d = val.replace(/\D/g, '').slice(0, 8);
    return d.length > 5 ? d.slice(0,5) + '-' + d.slice(5) : d;
  };

  const maskWhatsapp = (val) => {
    let d = val.replace(/\D/g, '').slice(0, 11);
    // O 1º dígito após o DDD (posição 2) deve ser obrigatoriamente '9'
    if (d.length > 2 && d[2] !== '9') {
      d = d.slice(0, 2); // rejeita o dígito inválido
    }
    if (d.length === 0) return '';
    if (d.length <= 2)  return `(${d}`;
    if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`;
    if (d.length <= 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
    return val;
  };

  // ── Validação ─────────────────────────────────────────────────
  const cepValido      = /^\d{5}-\d{3}$/.test(formData.cep);
  const emailValido    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const whatsValido    = /^\(\d{2}\) 9\d{4}-\d{4}$/.test(formData.whatsapp);
  const step3Valido    = formData.firstName && formData.lastName && emailValido && whatsValido;

  const submitToSheets = async () => {
    setIsSending(true);

    // Monta os campos específicos de cada tipo de serviço
    // Campos de outros serviços ficam em branco — evita envio cruzado de dados
    const camposTapete = serviceType === 'tapete'
      ? { tapeteComprimento: formData.tapeteLength, tapeteLargura: formData.tapeteWidth, tapeteEspessura: formData.tapeteThickness }
      : { tapeteComprimento: '', tapeteLargura: '', tapeteEspessura: '' };

    const camposEstofado = serviceType === 'estofado'
      ? { estofadoTipo: formData.estofadoType, estofadoLugares: formData.estofadoSeats }
      : { estofadoTipo: '', estofadoLugares: '' };

    const camposColchao = serviceType === 'colchao'
      ? { colchaoTipo: formData.colchaoType, colchaoTamanho: formData.colchaoSize }
      : { colchaoTipo: '', colchaoTamanho: '' };

    const payload = {
      timestamp: new Date().toLocaleString('pt-BR'),
      tipoServico: serviceType,
      ...camposTapete,
      ...camposEstofado,
      ...camposColchao,
      cep: formData.cep,
      fotoNome: formData.photoName || '',
      fotoBase64: formData.photoPreview || '',
      fotoTipo: formData.photo?.type || '',
      nome: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      whatsapp: formData.whatsapp,
    };

    try {
      if (APPS_SCRIPT_URL) {
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors', // necessário para Apps Script
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        console.warn('[Mr. Cleaner] VITE_SHEETS_WEBHOOK_URL não configurada. Configure o .env para ativar o envio.');
      }
    } catch (err) {
      // Log silencioso — não bloqueia UX do cliente
      console.error('[Mr. Cleaner] Erro ao enviar para planilha:', err);
    } finally {
      setIsSending(false);
      setStep(4); // Vai para tela de sucesso independente do resultado
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-dark/60 modal-overlay" onClick={onClose}></div>
      
      <div className="relative bg-surface w-full max-w-2xl mx-4 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="font-heading font-bold text-xl text-dark">
            {step === 1 ? 'Qual item precisa de spa?' : 
             step === 2 ? 'Detalhes do Item' : 
             step === 3 ? 'Seus Dados' : 'Recebemos seu pedido!'}
          </h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <X size={20} className="text-dark" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto flex-1">
          {/* Step 1: Select Type */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'estofado', label: 'Estofado', icon: <Sparkles size={32}/> },
                { id: 'tapete', label: 'Tapete', icon: <MapPin size={32}/> },
                { id: 'colchao', label: 'Colchão', icon: <ShieldCheck size={32}/> },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setServiceType(item.id);
                    setStep(2);
                  }}
                  className="flex flex-col items-center justify-center p-8 border-2 border-gray-100 rounded-[1.5rem] hover:border-accent hover:bg-accent/5 transition-all text-center group"
                >
                  <div className="text-gray-400 group-hover:text-accent mb-4 transition-colors">
                    {item.icon}
                  </div>
                  <span className="font-heading font-semibold text-dark text-lg">{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              {serviceType === 'tapete' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-500">Comprimento (m)</label>
                    <input type="number" step="0.1" name="tapeteLength" onChange={handleChange} className="w-full border-b border-gray-300 py-2 focus:border-accent focus:outline-none bg-transparent" placeholder="Ex: 2.0"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-500">Largura (m)</label>
                    <input type="number" step="0.1" name="tapeteWidth" onChange={handleChange} className="w-full border-b border-gray-300 py-2 focus:border-accent focus:outline-none bg-transparent" placeholder="Ex: 1.5"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-500">Espessura</label>
                    <select name="tapeteThickness" onChange={handleChange} className="w-full border-b border-gray-300 py-2 focus:border-accent focus:outline-none bg-transparent">
                      <option value="">Selecione</option>
                      <option value="fino">Fino (Pêlo curto)</option>
                      <option value="grosso">Grosso (Pêlo alto/Shaggy)</option>
                    </select>
                  </div>
                </div>
              )}

              {serviceType === 'estofado' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-500">Tipo de estofado</label>
                    <select name="estofadoType" onChange={handleChange} className="w-full border-b border-gray-300 py-2 focus:border-accent focus:outline-none bg-transparent">
                      <option value="">Selecione</option>
                      <option value="sofa">Sofá</option>
                      <option value="poltrona">Poltrona</option>
                      <option value="cadeira">Cadeira</option>
                      <option value="puff">Puff</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-500">Nº de Lugares</label>
                    <select name="estofadoSeats" onChange={handleChange} className="w-full border-b border-gray-300 py-2 focus:border-accent focus:outline-none bg-transparent">
                      <option value="">Selecione</option>
                      <option value="1">1 Lugar</option>
                      <option value="2">2 Lugares</option>
                      <option value="3">3 Lugares</option>
                      <option value="4+">4+ Lugares</option>
                      <option value="retrato">Retrátil / Assento Duplo</option>
                    </select>
                  </div>
                </div>
              )}

              {serviceType === 'colchao' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-500">Tipo do Colchão</label>
                    <select name="colchaoType" onChange={handleChange} className="w-full border-b border-gray-300 py-2 focus:border-accent focus:outline-none bg-transparent">
                      <option value="">Selecione</option>
                      <option value="molas">Molas</option>
                      <option value="espuma">Espuma</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-500">Tamanho</label>
                    <select name="colchaoSize" onChange={handleChange} className="w-full border-b border-gray-300 py-2 focus:border-accent focus:outline-none bg-transparent">
                      <option value="">Selecione</option>
                      <option value="berco">Berço</option>
                      <option value="solteiro">Solteiro</option>
                      <option value="viuva">Viúva</option>
                      <option value="casal">Casal Padrão</option>
                      <option value="queen">Queen Size</option>
                      <option value="king">King Size</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Universal fields for step 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">Seu CEP</label>
                  <input
                    type="text"
                    name="cep"
                    value={formData.cep}
                    maxLength={9}
                    placeholder="00000-000"
                    className={`w-full border-b py-2 focus:outline-none bg-transparent transition-colors ${
                      formData.cep && !cepValido ? 'border-red-400 text-red-500' : 'border-gray-300 focus:border-accent'
                    }`}
                    onChange={(e) => setFormData(prev => ({...prev, cep: maskCep(e.target.value)}))}
                  />
                  {formData.cep && !cepValido && (
                    <span className="text-red-400 text-xs mt-1 block">Formato: 00000-000</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">Foto do Item (Opcional)</label>
                  <label
                    htmlFor="photo-upload"
                    className="flex items-center gap-3 border border-dashed border-gray-300 p-3 rounded-xl text-gray-500 text-sm cursor-pointer hover:border-accent hover:bg-accent/5 transition-all group"
                  >
                    {formData.photoPreview ? (
                      <>
                        <img src={formData.photoPreview} alt="Preview" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-200" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-dark font-medium text-xs truncate">{formData.photoName}</span>
                          <span className="text-accent text-[10px]">Clique para trocar</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={20} className="shrink-0 group-hover:text-accent transition-colors" />
                        <span>Clique para selecionar uma foto...</span>
                      </>
                    )}
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setFormData(prev => ({
                          ...prev,
                          photo: file,
                          photoName: file.name,
                          photoPreview: ev.target.result,
                        }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button onClick={() => setStep(1)} className="text-gray-500 font-medium hover:text-dark">Voltar</button>
                <MagneticButton onClick={() => setStep(3)}>Avançar <ArrowRight size={16}/></MagneticButton>
              </div>
            </div>
          )}

          {/* Step 3: Contact */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">Nome</label>
                  <input type="text" name="firstName" onChange={handleChange} className="w-full border-b border-gray-300 py-2 focus:border-accent focus:outline-none bg-transparent" placeholder="Seu nome"/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">Sobrenome</label>
                  <input type="text" name="lastName" onChange={handleChange} className="w-full border-b border-gray-300 py-2 focus:border-accent focus:outline-none bg-transparent" placeholder="Seu sobrenome"/>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 mt-6">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">E-mail</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    placeholder="voce@email.com"
                    className={`w-full border-b py-2 focus:outline-none bg-transparent transition-colors ${
                      formData.email && !emailValido ? 'border-red-400 text-red-500' : 'border-gray-300 focus:border-accent'
                    }`}
                    onChange={handleChange}
                  />
                  {formData.email && !emailValido && (
                    <span className="text-red-400 text-xs mt-1 block">Digite um e-mail válido. Ex: voce@email.com</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">WhatsApp</label>
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    maxLength={15}
                    placeholder="(00) 90000-0000"
                    className={`w-full border-b py-2 focus:outline-none bg-transparent transition-colors ${
                      formData.whatsapp && !whatsValido ? 'border-red-400 text-red-500' : 'border-gray-300 focus:border-accent'
                    }`}
                    onChange={(e) => setFormData(prev => ({...prev, whatsapp: maskWhatsapp(e.target.value)}))}
                  />
                  {formData.whatsapp && !whatsValido && (
                    <span className="text-red-400 text-xs mt-1 block">Formato: (00) 90000-0000 — o 1º dígito após o DDD deve ser 9</span>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button onClick={() => setStep(2)} className="text-gray-500 font-medium hover:text-dark">Voltar</button>
                <MagneticButton
                  onClick={step3Valido && !isSending ? submitToSheets : undefined}
                  color="primary"
                  className={!step3Valido || isSending ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  {isSending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 14.627 0 20 20h-4a6 6 0 00-6-6v-4z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>Finalizar Orçamento <CheckCircle2 size={16}/></>
                  )}
                </MagneticButton>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-8 animate-fade-in">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={40} />
              </div>
              <h4 className="text-2xl font-drama italic text-dark">Tudo certo!</h4>
              <p className="text-gray-500 max-w-sm">
                Recebemos seu pedido de orçamento. Um de nossos especialistas fará a análise e entrará em contato via WhatsApp em minutos.
              </p>
              <div className="pt-6">
                <button 
                  onClick={() => { setStep(1); setServiceType(null); onClose(); }}
                  className="px-6 py-3 border border-gray-200 rounded-full font-medium hover:bg-gray-50"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// ========================
// SECTIONS
// ========================

function App() {
  const containerRef = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Navbar scroll effect
      ScrollTrigger.create({
        start: 'top -80',
        end: 99999,
        toggleClass: {
          className: 'bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-md',
          targets: '.smart-nav'
        }
      });

      // Hero animations
      gsap.from('.hero-elem', {
        y: 60,
        opacity: 0,
        stagger: 0.15,
        duration: 1.2,
        ease: 'power3.out',
        delay: 0.2
      });

      // Sticky Stacking Cards
      const cards = gsap.utils.toArray('.stack-card');
      cards.forEach((card, i) => {
        if (i < cards.length - 1) {
          ScrollTrigger.create({
            trigger: card,
            start: 'top top',
            endTrigger: '.stack-container',
            end: 'bottom bottom',
            pin: true,
            pinSpacing: false,
            animation: gsap.to(card, {
              scale: 0.9,
              opacity: 0.3,
              filter: 'blur(10px)',
              duration: 0.5,
              ease: 'none'
            }),
            scrub: true,
          });
        }
      });

      // Shuffler Card Animation (Interval simulated via GSAP timeline)
      const shufflerLabels = gsap.utils.toArray('.shuffler-label');
      if (shufflerLabels.length > 0) {
        gsap.set(shufflerLabels, { opacity: 0, y: 20 });
        let tl = gsap.timeline({ repeat: -1 });
        shufflerLabels.forEach((label, i) => {
          tl.to(label, { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' })
            .to(label, { opacity: 0, y: -20, duration: 0.5, delay: 2 });
        });
      }

    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full overflow-x-hidden bg-background">
      
      {/* NAVBAR */}
      <nav className="smart-nav nav-text fixed top-4 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-full flex items-center justify-between w-[90%] max-w-5xl transition-all duration-300 text-dark bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
        <div className="font-heading font-black text-2xl tracking-tighter cursor-pointer flex items-center gap-2">
          <img src="https://mrcleaner.com.br/wp-content/uploads/2020/05/cropped-fav_ico-32x32.png" alt="Mr Cleaner Favicon" className="w-6 h-6 rounded-md"/>
          MR.CLEANER
        </div>
        <div className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-700">
          <a href="#servicos" className="hover:text-accent transition-colors">Serviços</a>
          <a href="#diferenciais" className="hover:text-accent transition-colors">Diferenciais</a>
          <a href="#processo" className="hover:text-accent transition-colors">Processo</a>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="bg-accent text-white px-5 py-2.5 rounded-full font-heading font-semibold text-sm hover:scale-105 transition-transform"
        >
          Orçamento
        </button>
      </nav>

      {/* HERO SECTION */}
      <section className="relative w-full min-h-[100dvh] pt-32 pb-24 px-8 md:px-16 flex flex-col justify-end bg-dark overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero_before_after_wide_1774655795486.png" 
            alt="Hero Background Antes e Depois" 
            className="w-full h-full object-cover"
          />
          {/* Subtle gradient to protect readability on the bottom left without hiding the image */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark/95 via-dark/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-dark/80 via-dark/10 to-transparent"></div>
          
          {/* White wave divider at the bottom */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10 pointer-events-none">
            <svg className="relative block w-[calc(100%+1.3px)] h-[60px] md:h-[120px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C89.71,106.52,185.92,86.67,321.39,56.44Z" fill="#FAFAFA"></path>
            </svg>
          </div>
        </div>
        
        <div className="relative z-20 max-w-3xl flex flex-col items-start text-left mb-8 md:mb-16">
          <img src="https://mrcleaner.com.br/wp-content/uploads/2020/05/cropped-logo_mrr.png" alt="Mr Cleaner Logo" className="w-48 md:w-64 mb-8 hero-elem brightness-0 invert" />
          
          <h1 className="hero-elem font-heading font-bold text-white text-4xl md:text-5xl lg:text-7xl leading-[1.1] mb-8 tracking-tighter drop-shadow-2xl">
            Seu sofá <span className="text-gray-400">está sujo?</span><br/>
            Chame a Mr. Cleaner,<br/>
            o spa do seu sofá.
          </h1>
          
          <div className="hero-elem inline-block mt-4">
            <button 
              onClick={() => setModalOpen(true)}
              className="bg-accent hover:bg-[#159eb9] transition-colors text-white rounded-full px-8 py-5 font-heading font-bold text-sm tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-accent/30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
              <span>SOLICITE SEU ORÇAMENTO</span>
            </button>
          </div>
        </div>
      </section>

      {/* SERVIÇOS (PROTOCOL / STACK STACKING) */}
      <section id="servicos" className="stack-container bg-background">
        
        {/* Card 1: Estofados */}
        <div className="stack-card w-full h-[100dvh] bg-surface flex flex-col md:flex-row items-center border-b border-gray-100 sticky top-0">
          <div className="w-full md:w-1/2 p-12 md:p-24 flex flex-col justify-center h-full">
            <div className="font-data text-accent font-bold mb-4">FASE 01</div>
            <h2 className="font-heading font-bold text-5xl text-dark mb-6 tracking-tight">O Spa do Estofado</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Revitalização profunda não é apenas passar o aspirador. Elimina odores encardidos, remove fluidos orgânicos e traz de volta a textura macia de um móvel novo.
            </p>
            <ul className="space-y-4 font-body font-medium text-dark/80">
              <li className="flex gap-3 items-center"><CheckCircle2 className="text-accent"/> Ação anti-ácaro</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="text-accent"/> Resgate da cor original</li>
            </ul>
          </div>
          <div className="hidden md:flex w-1/2 h-full bg-gray-50 items-center justify-center p-12">
            <img src="https://mrcleaner.com.br/wp-content/uploads/elementor/thumbs/higienizacao-min2-qni7eauh9svjyg2t0whozspwsspe0wqkpjy590uz3g.jpg" className="rounded-3xl shadow-2xl w-full max-w-md h-full object-cover" />
          </div>
        </div>

        {/* Card 2: Impermeabilização */}
        <div className="stack-card w-full h-[100dvh] bg-gray-50 flex flex-col md:flex-row items-center border-b border-gray-200 sticky top-0">
          <div className="w-full md:w-1/2 p-12 md:p-24 flex flex-col justify-center h-full">
            <div className="font-data text-primary font-bold mb-4">FASE 02</div>
            <h2 className="font-heading font-bold text-5xl text-dark mb-6 tracking-tight">Escudo Hidrofóbico</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              A impermeabilização cria um campo de força invisível. Os fluidos não penetram. O tecido respira. A tranquilidade da sua família está garantida contra acidentes diários.
            </p>
            <ul className="space-y-4 font-body font-medium text-dark/80">
              <li className="flex gap-3 items-center"><CheckCircle2 className="text-primary"/> Encapsulamento de fibras</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="text-primary"/> Sem alteração de toque</li>
            </ul>
          </div>
          <div className="hidden md:flex w-1/2 h-full bg-white border-l border-gray-200 items-center justify-center p-12 relative overflow-hidden">
            <img src="https://mrcleaner.com.br/wp-content/uploads/elementor/thumbs/Impermeabilizacao22min-qni7eelu150p8vxcey479rrr6c6uvp5i22k364peek.jpg" className="rounded-3xl shadow-2xl relative z-10 w-full max-w-md h-full object-cover" />
            <div className="absolute inset-0 bg-primary/5 rounded-3xl animate-pulse"></div>
          </div>
        </div>

        {/* Card 3: Colchões */}
        <div className="stack-card w-full h-[100dvh] bg-surface flex flex-col md:flex-row items-center border-b border-gray-100 sticky top-0">
          <div className="w-full md:w-1/2 p-12 md:p-24 flex flex-col justify-center h-full">
            <div className="font-data text-accent font-bold mb-4">FASE 03</div>
            <h2 className="font-heading font-bold text-5xl text-dark mb-6 tracking-tight">Detox de Colchões</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Uma pessoa passa um terço da vida na cama. O acúmulo de suor e ácaros reduz a vida útil do colchão e afeta a qualidade do seu sono. Realizamos a purificação completa profunda a nível celular.
            </p>
            <ul className="space-y-4 font-body font-medium text-dark/80">
              <li className="flex gap-3 items-center"><CheckCircle2 className="text-accent"/> Remoção de Manchas de Suor</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="text-accent"/> Eliminação de Fungos e Ácaros</li>
            </ul>
          </div>
          <div className="hidden md:flex w-1/2 h-full bg-gray-50 items-center justify-center p-12">
            <img src="https://mrcleaner.com.br/wp-content/uploads/2021/05/limpeza-de-colchao.jpg.webp" alt="Higienização de Colchão" className="rounded-3xl shadow-2xl w-full max-w-md h-full object-cover" />
          </div>
        </div>

        {/* Card 4: Tapetes */}
        <div className="stack-card w-full h-[100dvh] bg-gray-50 flex flex-col md:flex-row items-center border-b border-gray-200 sticky top-0">
          <div className="w-full md:w-1/2 p-12 md:p-24 flex flex-col justify-center h-full">
            <div className="font-data text-primary font-bold mb-4">FASE 04</div>
            <h2 className="font-heading font-bold text-5xl text-dark mb-6 tracking-tight">Revitalização de Tapetes</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Mais do que lavar, aplicamos um processo industrial com equipamentos de última geração. O processo inclui desodorização, escovação mecanizada, enxágue absoluto, centrifugação inteligente e secagem controlada em estufa.
            </p>
            <ul className="space-y-4 font-body font-medium text-dark/80">
              <li className="flex gap-3 items-center"><CheckCircle2 className="text-primary"/> Secagem Controlada em Estufa</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="text-primary"/> Fim do Odor de Infiltração</li>
            </ul>
          </div>
          <div className="hidden md:flex w-1/2 h-full bg-white border-l border-gray-200 items-center justify-center p-12 relative overflow-hidden">
            <img src="https://mrcleaner.com.br/wp-content/uploads/2021/05/tapete-2-min.jpg.webp" alt="Revitalização de Tapete" className="rounded-3xl shadow-2xl relative z-10 w-full max-w-md h-full object-cover" />
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS (FEATURES / MICRO-UIS) */}
      <section id="diferenciais" className="py-24 md:py-32 px-4 md:px-8 bg-background relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Diagnostic Shuffler */}
          <div className="bg-surface border border-gray-100 rounded-[2.5rem] p-10 shadow-xl shadow-gray-200/40 relative overflow-hidden group interactive-hover">
            <div className="absolute top-8 right-8 text-gray-300 group-hover:text-primary transition-colors">
              <ShieldCheck size={32} />
            </div>
            
            <div className="h-32 relative mb-6">
              <div className="font-data text-xs text-gray-400 mb-2">RESULTADOS DA HIGIENIZAÇÃO</div>
              <div className="relative w-full h-16 mt-4">
                <div className="shuffler-label absolute inset-0 bg-primary/10 text-primary font-heading font-bold rounded-xl flex items-center px-4 border border-primary/20">Ácaros eliminados</div>
                <div className="shuffler-label absolute inset-0 bg-accent/10 text-accent font-heading font-bold rounded-xl flex items-center px-4 border border-accent/20">Bactérias removidas</div>
                <div className="shuffler-label absolute inset-0 bg-dark/5 text-dark font-heading font-bold rounded-xl flex items-center px-4 border border-gray-200">Fungos exterminados</div>
              </div>
            </div>
            <h3 className="font-heading font-bold text-2xl text-dark mb-3 tracking-tight">Higienização Profunda</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Equipamentos de última geração e colaboradores meticulosamente equipados garantem segurança e saúde domiciliar impecáveis.
            </p>
          </div>

          {/* Card 2: Telemetry Typewriter */}
          <div className="bg-surface border border-gray-100 rounded-[2.5rem] p-10 shadow-xl shadow-gray-200/40 relative overflow-hidden group interactive-hover">
            <div className="flex items-center gap-2 font-data text-xs text-accent uppercase tracking-wider font-semibold mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping"></span>
              Live Feed
            </div>
            <div className="bg-dark rounded-2xl p-6 h-32 mb-6 font-data text-xs text-green-400 overflow-hidden relative shadow-inner">
              <div className="flex flex-col gap-2">
                <span className="opacity-50">&gt; Iniciando encapsulamento de fibras...</span>
                <span>&gt; Integridade do tecido: Preservada.</span>
                <span className="text-white">&gt; Estimativa de ácaros purgados: 1M / ano<span className="animate-pulse">_</span></span>
              </div>
            </div>
            <h3 className="font-heading font-bold text-2xl text-dark mb-3 tracking-tight">Durabilidade Tática</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Mais do que limpeza, um detox profundo. Evita manchas de suor e desgastes estruturais no seu estofado ou colchão.
            </p>
          </div>

          {/* Card 3: Cursor Protocol */}
          <div className="bg-surface border border-gray-100 rounded-[2.5rem] p-10 shadow-xl shadow-gray-200/40 relative overflow-hidden group interactive-hover">
             <div className="absolute top-8 right-8 text-gray-300 group-hover:text-primary transition-colors">
              <CreditCard size={32} />
            </div>
            <div className="h-32 mb-6 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-gray-200">
              <div className="font-heading font-black text-4xl text-dark mb-1">ATÉ 6x</div>
              <div className="font-data text-xs text-gray-500 uppercase tracking-widest">Sem juros no crédito</div>
            </div>
            <h3 className="font-heading font-bold text-2xl text-dark mb-3 tracking-tight">Conveniência Máxima</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Descontos progressivos: quanto mais peças higienizadas na visita domiciliar, menor o custo total.
            </p>
          </div>
        </div>
      </section>

      {/* ANTES E DEPOIS - RESULTS GALLERY */}
      <section id="resultados" className="py-24 md:py-32 px-4 md:px-8 bg-[#fafafa] relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="font-heading font-bold text-4xl md:text-6xl text-dark mb-6 tracking-tighter uppercase">Resultados que <span className="font-drama italic text-accent font-normal lowercase">impressionam</span></h2>
            <p className="text-gray-500 text-lg md:text-xl font-light max-w-2xl mx-auto">
              Veja a diferença real que a higienização técnica da Mr. Cleaner proporciona.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { 
                title: "Estofados", 
                desc: "Remoção de 100% das manchas e biofilme.", 
                img: "/sofa_before_after_clean_1774655994579.png" 
              },
              { 
                title: "Tapetes", 
                desc: "Cores restauradas e fibras revitalizadas.", 
                img: "/rug_before_after_clean_1774656018456.png" 
              },
              { 
                title: "Colchões", 
                desc: "Eliminação total de ácaros e resíduos.", 
                img: "/mattress_before_after_1774654709111.png" 
              }
            ].map((item, i) => (
              <div key={i} className="group relative overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-gray-200/50 flex flex-col h-full border border-gray-100">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/60 via-transparent to-transparent opacity-60"></div>
                  
                  {/* Before/After Labels */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
                    <span className="bg-dark/40 backdrop-blur-md text-white text-[10px] font-data px-3 py-1 rounded-full uppercase tracking-widest border border-white/20">Antes</span>
                    <span className="bg-accent/80 backdrop-blur-md text-white text-[10px] font-data px-3 py-1 rounded-full uppercase tracking-widest border border-accent/20">Depois</span>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 z-20">
                    <h4 className="font-heading font-bold text-white text-2xl mb-1 tracking-tight">{item.title}</h4>
                    <p className="text-white/80 text-sm leading-tight">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESSO (PHILOSOPHY / MANIFESTO) */}
      <section id="processo" className="relative w-full min-h-[60vh] flex items-center justify-center bg-dark py-32 px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src="https://mrcleaner.com.br/wp-content/uploads/2021/04/familia.jpg.webp" className="w-full h-full object-cover grayscale" alt="Família" />
          <div className="absolute inset-0 bg-dark mix-blend-multiply"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center">
          <p className="font-body text-gray-400 text-lg md:text-xl max-w-2xl mb-12 font-light">
            A maioria da indústria de limpeza foca apenas em <strong>aparência superficial.</strong>
          </p>
          <h2 className="font-heading font-semibold text-4xl md:text-6xl text-white leading-tight">
            Nós focamos em <span className="font-drama italic text-accent font-normal text-[1.2em]">saúde respiratória</span> e <span className="font-drama italic text-primary font-normal text-[1.2em]">renovação celular</span> dos seus tecidos.
          </h2>
        </div>
      </section>

      {/* FINAL CTA & FOOTER */}
      <footer className="bg-dark text-white pt-32 pb-12 px-8 rounded-t-[4rem] relative z-40 mt-[-4rem]">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          <div className="font-data text-accent mb-6 flex items-center gap-2 text-sm bg-accent/10 px-4 py-2 rounded-full border border-accent/20">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping"></span>
             98.4% de Satisfação (Auditado)
          </div>
          <h2 className="font-heading font-bold text-5xl md:text-7xl mb-12 tracking-tighter">
            O INVESTIMENTO QUE SE
            <span className="block font-drama italic text-primary/95 text-[1.1em] mt-2 font-normal">Paga em Vida Útil.</span>
          </h2>
          
          <MagneticButton onClick={() => setModalOpen(true)} className="mb-24 scale-125">
             Solicitar Orçamento <ArrowRight size={20}/>
          </MagneticButton>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full border-t border-white/10 pt-12 text-sm text-gray-400">
            <div className="text-left font-data">
              <img src="https://mrcleaner.com.br/wp-content/uploads/2020/05/cropped-logo_mrr.png" className="w-48 mb-6 brightness-0 invert opacity-80" />
              <p>Inovamos na prestação de<br/>serviços de alta performance.</p>
            </div>
            <div className="text-left md:text-center grid gap-2">
              <a href="#" className="hover:text-accent transition-colors">Termos Médicos / Segurança</a>
              <a href="#" className="hover:text-accent transition-colors">Política de Privacidade</a>
            </div>
            <div className="text-left md:text-right flex items-center md:items-start md:justify-end gap-2 text-green-400 font-data">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mt-1"></span>
              SISTEMA OPERACIONAL
            </div>
          </div>
        </div>
      </footer>

      {/* RENDER MODAL */}
      <BudgetModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

    </div>
  );
}

export default App;

import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import Header from "@/components/Header";
import {
  Heart, X, Bookmark, MapPin, Calendar, MessageSquare,
  Plus, Check, Star, Shield, Zap, Search, ArrowLeft,
  Trophy, Users, RefreshCw, ChevronDown, ChevronUp,
  Send, Phone, Video, Sparkles, Award, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";

/* ─── Injected styles ──────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  .bf-display { font-family: 'Fraunces', Georgia, serif; }
  .bf-body    { font-family: 'DM Sans', system-ui, sans-serif; }

  @keyframes bf-sl  { to { transform:translateX(-150%) rotate(-28deg); opacity:0; } }
  @keyframes bf-sr  { to { transform:translateX( 150%) rotate( 28deg); opacity:0; } }
  @keyframes bf-pop { 0%{transform:scale(.55);opacity:0} 65%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
  @keyframes bf-up  { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes bf-bnc { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.22)} 100%{transform:scale(1);opacity:1} }
  @keyframes bf-pls { 0%,100%{box-shadow:0 0 0 0 rgba(251,146,60,.55)} 50%{box-shadow:0 0 0 16px rgba(251,146,60,0)} }

  .bf-sl   { animation: bf-sl  .40s cubic-bezier(.36,.07,.19,.97) forwards; }
  .bf-sr   { animation: bf-sr  .40s cubic-bezier(.36,.07,.19,.97) forwards; }
  .bf-pop  { animation: bf-pop .38s cubic-bezier(.34,1.56,.64,1)  both; }
  .bf-up   { animation: bf-up  .36s ease both; }
  .bf-bnc  { animation: bf-bnc .34s cubic-bezier(.34,1.56,.64,1)  both; }
  .bf-pls  { animation: bf-pls 2.2s ease-in-out infinite; }

  .bf-card-shadow { box-shadow:0 28px 56px -12px rgba(0,0,0,.22),0 0 0 1px rgba(255,255,255,.1); }
  .bf-scroll::-webkit-scrollbar { width:4px; }
  .bf-scroll::-webkit-scrollbar-thumb { background:#fed7aa; border-radius:8px; }
  .chat-l { border-radius:18px 18px 18px 4px; }
  .chat-r { border-radius:18px 18px 4px 18px; }

  .pet-img { width:100%; height:100%; object-fit:cover; transition: transform .5s ease; }
  .pet-img-wrap:hover .pet-img { transform:scale(1.06); }

  .sp-pill { display:inline-flex; align-items:center; gap:6px; padding:6px 16px; border-radius:999px; font-weight:700; font-size:.8rem; border:2px solid transparent; cursor:pointer; transition:all .18s ease; }
  .sp-pill-dog  { background:#fff7ed; color:#c2410c; border-color:#fed7aa; }
  .sp-pill-dog.active { background:#ea580c; color:#fff; border-color:#ea580c; }
  .sp-pill-cat  { background:#fdf4ff; color:#7e22ce; border-color:#e9d5ff; }
  .sp-pill-cat.active { background:#9333ea; color:#fff; border-color:#9333ea; }
  .sp-pill-all  { background:#f1f5f9; color:#475569; border-color:#e2e8f0; }
  .sp-pill-all.active { background:#334155; color:#fff; border-color:#334155; }
`;

/* ─── Types ────────────────────────────────────────────────────────────────── */
type Species = "dog" | "cat";
interface Pet {
    id: string | number; name: string; species: Species;
    breed: string; age: number; gender: "Male" | "Female";
    location: string; city: string;
    ownerId?: string; ownerClerkId?: string; owner: string; ownerAvatar: string; ownerVerified: boolean;
  vaccinated: boolean; pedigree: boolean;
  photo: string; fallbackEmoji?: string;
  description: string; traits: string[];
  weight: string; color: string; score: number;
  healthCerts: string[]; joinedDate: string;
}
interface Msg   { id:number; from:"me"|"them"; text:string; time:string; }
interface Match { petId:string|number; messages:Msg[]; }

const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=400&h=400&fit=crop&q=80`;
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const ALL_PETS: Pet[] = [
  { id:1, name:"Luna", species:"dog", breed:"Golden Retriever", age:3, gender:"Female", location:"San Francisco, CA", city:"San Francisco", owner:"Sarah J.", ownerAvatar:"👩🏻", ownerVerified:true, vaccinated:true, pedigree:true, photo:"https://images.unsplash.com/photo-1588022274642-f238f77ec193?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0", fallbackEmoji:"🐕", description:"Champion bloodline Golden with a gentle soul. AKC registered, OFA certified, loves kids and long hikes.", traits:["Playful","Gentle","Loyal","Smart"], weight:"28 kg", color:"Golden", score:96, healthCerts:["OFA Hips","OFA Elbows","CERF Eyes"], joinedDate:"Feb 2024" },
  { id:2, name:"Max", species:"dog", breed:"German Shepherd", age:4, gender:"Male", location:"Los Angeles, CA", city:"Los Angeles", owner:"John S.", ownerAvatar:"👨🏽", ownerVerified:true, vaccinated:true, pedigree:true, photo:"https://www.carecredit.com/sites/cc/image/german_shepherd_dog_guide.jpg", fallbackEmoji:"🐕", description:"Award-winning Schutzhund dog. Superb structure, rock-solid temperament across generations.", traits:["Protective","Alert","Confident","Trainable"], weight:"35 kg", color:"Black & Tan", score:91, healthCerts:["OFA Hips","DM Clear","MDR1 Clear"], joinedDate:"Jan 2024" },
  { id:3, name:"Bella", species:"dog", breed:"Labrador Retriever", age:2, gender:"Female", location:"San Diego, CA", city:"San Diego", owner:"Emily D.", ownerAvatar:"👩🏼", ownerVerified:true, vaccinated:true, pedigree:false, photo:"https://www.pets-lifestyle.com/cdn/shop/articles/Labrador_Retriever_in_India.webp?crop=center&height=500&v=1711004269&width=600", fallbackEmoji:"🐕", description:"High-energy chocolate Lab. Water-obsessed, food-motivated, endlessly affectionate.", traits:["Energetic","Friendly","Eager","Playful"], weight:"25 kg", color:"Chocolate", score:88, healthCerts:["OFA Hips","EIC Clear"], joinedDate:"Mar 2024" },
  { id:4, name:"Charlie", species:"dog", breed:"French Bulldog", age:3, gender:"Male", location:"New York, NY", city:"New York", owner:"Michael B.", ownerAvatar:"👨🏾", ownerVerified:true, vaccinated:true, pedigree:true, photo:"https://www.akc.org/wp-content/uploads/2017/11/French-Bulldog-standing-outdoors.jpg", fallbackEmoji:"🐕", description:"Champion Frenchie with brindle markings. Calm, adaptable, overflowing with personality.", traits:["Affectionate","Calm","Adaptable","Comical"], weight:"12 kg", color:"Brindle", score:84, healthCerts:["BOAS Assessed","Cardiac Clear"], joinedDate:"Dec 2023" },
  { id:5, name:"Daisy", species:"dog", breed:"Dachshund", age:2, gender:"Female", location:"Austin, TX", city:"Austin", owner:"Lisa W.", ownerAvatar:"👩🏻", ownerVerified:false, vaccinated:true, pedigree:false, photo:"https://static.stacker.com/s3fs-public/styles/slide_desktop/s3/DachshunddachshundleadDBMK.jpg", fallbackEmoji:"🐕", description:"Miniature smooth-coat dachshund. Fearless, curious and deeply devoted.", traits:["Curious","Brave","Spirited","Independent"], weight:"5 kg", color:"Red", score:79, healthCerts:["IVDD Screened"], joinedDate:"Apr 2024" },
  { id:6, name:"Rocky", species:"dog", breed:"Bulldog", age:5, gender:"Male", location:"Chicago, IL", city:"Chicago", owner:"Tom H.", ownerAvatar:"👨🏻", ownerVerified:true, vaccinated:true, pedigree:true, photo:"https://upload.wikimedia.org/wikipedia/commons/b/bf/Bulldog_inglese.jpg", fallbackEmoji:"🐕", description:"Dignified English Bulldog with championship lineage. Patient, gentle and unexpectedly goofy.", traits:["Docile","Friendly","Patient","Gentle"], weight:"23 kg", color:"White & Fawn", score:86, healthCerts:["Cardiac Clear","Hip OFA"], joinedDate:"Nov 2023" },
  { id:7, name:"Mia", species:"dog", breed:"Poodle", age:2, gender:"Female", location:"Seattle, WA", city:"Seattle", owner:"Anna P.", ownerAvatar:"👩🏻", ownerVerified:true, vaccinated:true, pedigree:true, photo:"https://ask.woodgreen.org.uk/media/pages/images/99f12e906e-1737559438/miniature-poodle-1200x630-crop.jpg", fallbackEmoji:"🐩", description:"Standard Poodle and top agility competitor. Hypoallergenic, athletic, almost unsettlingly intelligent.", traits:["Intelligent","Athletic","Elegant","Alert"], weight:"22 kg", color:"Apricot", score:93, healthCerts:["SA Clear","vWD Clear","OFA Hips"], joinedDate:"Jan 2024" },
  { id:8, name:"Duke", species:"dog", breed:"Beagle", age:3, gender:"Male", location:"Boston, MA", city:"Boston", owner:"Chris L.", ownerAvatar:"👨🏻", ownerVerified:false, vaccinated:true, pedigree:false, photo:"https://www.zooplus.ie/magazine/wp-content/uploads/2018/05/2-Jahre-Beagle.webp", fallbackEmoji:"🐕", description:"Classic tri-color Beagle. Nose-driven, pack-oriented, guaranteed to make you smile.", traits:["Curious","Merry","Friendly","Determined"], weight:"11 kg", color:"Tri-color", score:77, healthCerts:["MLS Clear","Hip OFA"], joinedDate:"Mar 2024" },
  { id:9, name:"Misty", species:"cat", breed:"Persian", age:3, gender:"Female", location:"New York, NY", city:"New York", owner:"Rachel K.", ownerAvatar:"👩🏻", ownerVerified:true, vaccinated:true, pedigree:true, photo:U("1518288774672-b94e808873ff"), fallbackEmoji:"🐱", description:"Show-quality white Persian with silky coat and doll-face features.", traits:["Gentle","Calm","Affectionate","Quiet"], weight:"4 kg", color:"White", score:94, healthCerts:["PKD Negative","HCM Screened"], joinedDate:"Jan 2024" },
  { id:10, name:"Leo", species:"cat", breed:"Maine Coon", age:4, gender:"Male", location:"Portland, OR", city:"Portland", owner:"James T.", ownerAvatar:"👨🏻", ownerVerified:true, vaccinated:true, pedigree:true, photo:U("1611689342806-0863de1ef18f"), fallbackEmoji:"🐱", description:"Magnificent Maine Coon with tufted ears and a lion's mane.", traits:["Playful","Loyal","Sociable","Vocal"], weight:"7 kg", color:"Brown Tabby", score:91, healthCerts:["HCM Clear","SMA Clear"], joinedDate:"Feb 2024" },
  { id:11, name:"Cleo", species:"cat", breed:"Siamese", age:2, gender:"Female", location:"Miami, FL", city:"Miami", owner:"Sofia M.", ownerAvatar:"👩🏽", ownerVerified:true, vaccinated:true, pedigree:true, photo:U("1561948955-570b270e7c36"), fallbackEmoji:"🐱", description:"Traditional Siamese with piercing blue eyes and an endlessly chatty personality.", traits:["Vocal","Intelligent","Affectionate","Curious"], weight:"3.5 kg", color:"Seal Point", score:89, healthCerts:["FIV Negative","FeLV Negative"], joinedDate:"Mar 2024" },
  { id:12, name:"Oliver", species:"cat", breed:"British Shorthair", age:3, gender:"Male", location:"Denver, CO", city:"Denver", owner:"Mark H.", ownerAvatar:"👨🏼", ownerVerified:true, vaccinated:true, pedigree:true, photo:U("1573865526182-010ac58acf60"), fallbackEmoji:"🐱", description:"Plush silver British Shorthair with teddy-bear looks.", traits:["Independent","Calm","Loyal","Easygoing"], weight:"5.5 kg", color:"Silver", score:87, healthCerts:["PKD Negative","Blood Type A"], joinedDate:"Dec 2023" },
  { id:13, name:"Luna", species:"cat", breed:"Ragdoll", age:2, gender:"Female", location:"Austin, TX", city:"Austin", owner:"Emma R.", ownerAvatar:"👩🏼", ownerVerified:false, vaccinated:true, pedigree:false, photo:U("1605001011156-cbf0ad9f4bf9"), fallbackEmoji:"🐱", description:"Blue-eyed Ragdoll who goes limp in your arms.", traits:["Gentle","Quiet","Loving","Relaxed"], weight:"5 kg", color:"Colorpoint", score:82, healthCerts:["HCM Screened"], joinedDate:"Apr 2024" },
  { id:14, name:"Shadow", species:"cat", breed:"Bombay", age:4, gender:"Male", location:"Chicago, IL", city:"Chicago", owner:"David C.", ownerAvatar:"👨🏽", ownerVerified:true, vaccinated:true, pedigree:true, photo:U("1514888286974-6c03e2ca1dba"), fallbackEmoji:"🐱", description:"Sleek all-black Bombay — the mini-panther of cats.", traits:["Social","Active","Affectionate","Playful"], weight:"4.5 kg", color:"Jet Black", score:85, healthCerts:["HCM Clear","FIV Negative"], joinedDate:"Nov 2023" },
  { id:15, name:"Ginger", species:"cat", breed:"Scottish Fold", age:2, gender:"Female", location:"San Francisco, CA", city:"San Francisco", owner:"Amy L.", ownerAvatar:"👩🏻", ownerVerified:true, vaccinated:true, pedigree:true, photo:U("1574158622682-e719686f4f35"), fallbackEmoji:"🐱", description:"Adorable orange Scottish Fold with folded ears and huge round eyes.", traits:["Sweet","Gentle","Curious","Adaptable"], weight:"3.8 kg", color:"Orange Tabby", score:90, healthCerts:["Osteochondrodysplasia Clear","HCM Normal"], joinedDate:"Jan 2024" },
  { id:16, name:"Ash", species:"cat", breed:"Norwegian Forest Cat", age:3, gender:"Male", location:"Seattle, WA", city:"Seattle", owner:"Kai B.", ownerAvatar:"👨🏻", ownerVerified:false, vaccinated:true, pedigree:false, photo:U("1592194996308-7b43878e84a6"), fallbackEmoji:"🐱", description:"Thick-coated Norwegian Forest Cat built for adventure.", traits:["Independent","Athletic","Curious","Hardy"], weight:"6 kg", color:"Grey Tabby", score:80, healthCerts:["GSD IV Clear","HCM Screened"], joinedDate:"Feb 2024" },
];

const ALL_CITIES = [...new Set(ALL_PETS.map(p=>p.city))];
const scoreStyle = (s:number) => s>=90?"bg-emerald-50 text-emerald-700 border-emerald-200":s>=80?"bg-amber-50 text-amber-700 border-amber-200":"bg-sky-50 text-sky-700 border-sky-200";

/* ─── PetPhoto ─────────────────────────────────────────────────────────────── */
function PetPhoto({ pet, className }: { pet: Pet; className?: string }) {
  const [err, setErr] = useState(false);
  return err ? (
    <div className={cn("flex items-center justify-center bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100", className)}>
      <Users className="w-16 h-16 text-gray-400" />
    </div>
  ) : (
    <div className={cn("overflow-hidden pet-img-wrap", className)}>
      <img src={pet.photo} alt={`${pet.name} the ${pet.breed}`} className="pet-img" onError={() => setErr(true)} />
    </div>
  );
}

/* ─── SwipeCard ────────────────────────────────────────────────────────────── */
function SwipeCard({ pet, isTop, swipeDir, onLike, onPass, onSave, isSaved }: {
  pet:Pet; isTop:boolean; swipeDir:"left"|"right"|null;
  onLike:()=>void; onPass:()=>void; onSave:()=>void; isSaved:boolean;
}) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const startX = useRef(0);

  const onMD = (e:React.MouseEvent) => { if(!isTop) return; startX.current=e.clientX; setDragging(true); };
  const onMM = useCallback((e:React.MouseEvent) => { if(!dragging) return; setDx(e.clientX-startX.current); },[dragging]);
  const onMU = useCallback(() => { if(!dragging) return; setDragging(false); if(dx>90) onLike(); else if(dx<-90) onPass(); else setDx(0); },[dragging,dx,onLike,onPass]);
  const onTS = (e:React.TouchEvent) => { if(!isTop) return; startX.current=e.touches[0].clientX; setDragging(true); };
  const onTM = (e:React.TouchEvent) => { if(!dragging) return; setDx(e.touches[0].clientX-startX.current); };
  const onTE = () => { if(!dragging) return; setDragging(false); if(dx>90) onLike(); else if(dx<-90) onPass(); else setDx(0); };

  const rot=dx*0.07, likeOp=Math.min(Math.max(dx/90,0),1), passOp=Math.min(Math.max(-dx/90,0),1);
  const speciesAccent = pet.species==="cat" ? "text-purple-500" : "text-orange-500";

  return (
    <div
      className={cn("absolute inset-0 rounded-[28px] overflow-hidden bg-white bf-body select-none bf-card-shadow", isTop?"cursor-grab active:cursor-grabbing":"", !dragging&&!swipeDir?"transition-transform duration-200":"", swipeDir==="right"?"bf-sr":swipeDir==="left"?"bf-sl":"")}
      style={{ zIndex:isTop?10:5, transform:isTop?`translateX(${dx}px) rotate(${rot}deg)`:"scale(0.94) translateY(18px)" }}
      onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}
      onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
    >
      <div className="relative h-64 flex-shrink-0">
        <PetPhoto pet={pet} className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none"/>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-emerald-400/30 flex items-center justify-end pr-6 pointer-events-none" style={{opacity:likeOp}}>
          <span className="bg-emerald-500 text-white font-black text-xl px-4 py-2 rounded-2xl rotate-12 border-[3px] border-white shadow-lg">LIKE 💚</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-red-400/30 flex items-center justify-start pl-6 pointer-events-none" style={{opacity:passOp}}>
          <span className="bg-red-500 text-white font-black text-xl px-4 py-2 rounded-2xl -rotate-12 border-[3px] border-white shadow-lg">NOPE ✕</span>
        </div>
        <div className={cn("absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-sm bg-white/80",scoreStyle(pet.score))}><Sparkles className="w-3 h-3"/>{pet.score}% match</div>
        {pet.pedigree && <div className="absolute top-3 left-3 flex items-center gap-1 bg-yellow-400/90 backdrop-blur-sm text-yellow-900 px-2.5 py-1 rounded-full text-xs font-bold shadow"><Trophy className="w-3 h-3"/> Pedigree</div>}
        <div className={cn("absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm shadow", pet.species==="cat"?"bg-purple-500/90 text-white":"bg-orange-500/90 text-white")}>{pet.species==="cat"?"🐱":"🐕"} {pet.species==="cat"?"Cat":"Dog"}</div>
      </div>
      <div className="p-4 space-y-2.5 overflow-y-auto bf-scroll" style={{maxHeight:expanded?310:"auto"}}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="bf-display text-[1.6rem] font-black text-gray-900 leading-none">{pet.name}</h2>
            <p className={cn("font-semibold text-sm mt-0.5",speciesAccent)}>{pet.breed}</p>
          </div>
          <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full"><Calendar className="w-3 h-3"/>{pet.age}yr · {pet.gender}</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-orange-400"/>{pet.location}</span>
          <span className="flex items-center gap-1"><Shield className={cn("w-3 h-3",pet.vaccinated?"text-emerald-500":"text-gray-300")}/>{pet.vaccinated?"Vaccinated":"Not vaccinated"}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {pet.traits.map(t=><span key={t} className={cn("px-2 py-0.5 rounded-full text-xs font-semibold border",pet.species==="cat"?"bg-purple-50 border-purple-100 text-purple-700":"bg-orange-50 border-orange-100 text-orange-700")}>{t}</span>)}
        </div>
        <button onClick={e=>{e.stopPropagation();setExpanded(!expanded);}} className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition-colors">
          <Info className="w-3 h-3"/>{expanded?"Less":"More"} info{expanded?<ChevronUp className="w-3 h-3"/>:<ChevronDown className="w-3 h-3"/>}
        </button>
        {expanded && (
          <div className="space-y-3 pt-2 border-t border-gray-100 bf-up">
            <p className="text-sm text-gray-600 leading-relaxed">{pet.description}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 rounded-xl p-2.5 flex justify-between"><span className="text-gray-400">Weight</span><span className="font-bold text-gray-800">{pet.weight}</span></div>
              <div className="bg-gray-50 rounded-xl p-2.5 flex justify-between"><span className="text-gray-400">Color</span><span className="font-bold text-gray-800">{pet.color}</span></div>
            </div>
            {pet.healthCerts.length>0 && <div className="flex flex-wrap gap-1.5">{pet.healthCerts.map(c=><span key={c} className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium">✓ {c}</span>)}</div>}
            <div className={cn("flex items-center gap-3 rounded-2xl p-3",pet.species==="cat"?"bg-purple-50/60":"bg-orange-50/60")}>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                {pet.ownerAvatar&&pet.ownerAvatar.startsWith("http")?<img src={pet.ownerAvatar} alt={pet.owner} className="w-full h-full object-cover"/>:<Users className="w-5 h-5 text-gray-400"/>}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-gray-900">{pet.owner}</p>
                  {pet.ownerVerified&&<span className="text-[10px] bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded-full">✓</span>}
                </div>
                <p className="text-xs text-gray-400">Member since {pet.joinedDate}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Legacy internal ChatPanel ────────────────────────────────────────────── */
function ChatPanel({ pet, match, onSend, onClose }:{ pet:Pet; match:Match; onSend:(t:string)=>void; onClose:()=>void; }) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[match.messages]);
  return (
    <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm bf-body">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
        <button onClick={onClose} className="text-gray-400 hover:text-orange-500 transition-colors"><ArrowLeft className="w-5 h-5"/></button>
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"><PetPhoto pet={pet} className="w-full h-full"/></div>
        <div className="flex-1"><p className="bf-display font-black text-gray-900 text-lg leading-none">{pet.name}</p><p className="text-xs text-gray-400">{pet.owner} · {pet.breed}</p></div>
        <div className="flex gap-2">
          <button className="w-9 h-9 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center hover:bg-orange-200 transition-colors"><Phone className="w-4 h-4"/></button>
          <button className="w-9 h-9 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center hover:bg-orange-200 transition-colors"><Video className="w-4 h-4"/></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bf-scroll bg-[#FEF7ED]/40">
        {match.messages.length===0&&<div className="text-center py-8"><div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-3 shadow"><PetPhoto pet={pet} className="w-full h-full"/></div><p className="text-sm text-gray-400">Say hi to <strong className="text-gray-700">{pet.owner}</strong> about {pet.name}!</p></div>}
        {match.messages.map(msg=>(
          <div key={msg.id} className={cn("flex gap-2",msg.from==="me"?"justify-end":"justify-start")}>
            {msg.from==="them"&&<div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-gray-200 flex items-center justify-center">{pet.ownerAvatar&&pet.ownerAvatar.startsWith("http")?<img src={pet.ownerAvatar} alt={pet.owner} className="w-full h-full object-cover"/>:<Users className="w-4 h-4 text-gray-400"/>}</div>}
            <div className={cn("max-w-[75%] px-4 py-2.5 text-sm leading-relaxed",msg.from==="me"?"bg-gradient-to-br from-orange-500 to-amber-400 text-white chat-r":"bg-white text-gray-800 chat-l border border-gray-100 shadow-sm")}>
              {msg.text}<p className={cn("text-[10px] mt-0.5",msg.from==="me"?"text-white/60 text-right":"text-gray-400")}>{msg.time}</p>
            </div>
          </div>
        ))}
        <div ref={endRef}/>
      </div>
      <div className="px-4 py-3 border-t border-gray-100 flex gap-2 bg-white">
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&text.trim()){onSend(text.trim());setText("");}}} placeholder={`Message ${pet.owner}…`} className="flex-1 px-4 py-2.5 text-sm bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"/>
        <button onClick={()=>{if(text.trim()){onSend(text.trim());setText("");}}} disabled={!text.trim()} className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-40"><Send className="w-4 h-4"/></button>
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */
export default function Breeding() {
  const [view, setView] = useState<"discover"|"matches">("discover");
  const [allPets, setAllPets] = useState<Pet[]>(ALL_PETS.map(p=>({...p,id:p.id.toString()})));
  const [deck, setDeck] = useState<Pet[]>(ALL_PETS.map(p=>({...p,id:p.id.toString()})));
  const [loading, setLoading] = useState(true);
  const [swipeDir, setSwipeDir] = useState<"left"|"right"|null>(null);
  const [liked, setLiked] = useState<(string|number)[]>([]);
  const [saved, setSaved] = useState<(string|number)[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeChat, setActiveChat] = useState<string|number|null>(null);
  const [feedback, setFeedback] = useState<"like"|"pass"|"save"|null>(null);

  const { user } = useUser();
  const navigate = useNavigate();
  const currentOwner = user?.firstName || user?.fullName || "You";
  const ownerAvatar = user?.imageUrl ?? "";

  const [myPet, setMyPet] = useState<Pet|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string|null>(null);
  const [form, setForm] = useState({ name:"", species:"dog" as Species, breed:"", age:"", gender:"Male" as "Male"|"Female", city:"", location:"", photo:"", description:"", weight:"", color:"", traits:"", healthCerts:"", vaccinated:true, pedigree:false });

  const normalizePet = (pet: any): Pet => {
    const id = pet.id ?? pet._id ?? Date.now().toString();
    return { ...pet, id: id.toString(), ownerClerkId: pet.ownerClerkId||"", ownerAvatar: pet.ownerAvatar||"", description: pet.description||"Looking for the perfect match!", traits: pet.traits||[], healthCerts: pet.healthCerts||[], score: pet.score??0, joinedDate: pet.joinedDate||new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"}) };
  };

  useEffect(() => {
    async function loadPets() {
      try {
        const res = await fetch("/api/pets");
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const pets = data.map(normalizePet); setAllPets(pets); setDeck(pets);
        } else {
          const fb = ALL_PETS.map(p=>({...p,id:p.id.toString()})); setAllPets(fb); setDeck(fb);
        }
      } catch {
        const fb = ALL_PETS.map(p=>({...p,id:p.id.toString()})); setAllPets(fb); setDeck(fb);
      } finally { setLoading(false); }
    }
    loadPets();
  }, []);

  const DOG_BREEDS_DYNAMIC = [...new Set(allPets.filter(p=>p.species==="dog").map(p=>p.breed))];
  const CAT_BREEDS_DYNAMIC = [...new Set(allPets.filter(p=>p.species==="cat").map(p=>p.breed))];
  const CITY_OPTIONS = [...new Set(allPets.map(p=>p.city))];

  const [speciesFilter, setSpeciesFilter] = useState<"all"|Species>("all");
  const [search, setSearch] = useState("");
  const [fBreed, setFBreed] = useState("");
  const [fGender, setFGender] = useState<"Male"|"Female"|"both">("both");
  const [fAgeMax, setFAgeMax] = useState(12);
  const [fCity, setFCity] = useState("");
  const [fVacc, setFVacc] = useState(false);
  const [fPedigree, setFPedigree] = useState(false);

  const breedOptions = speciesFilter==="cat" ? CAT_BREEDS_DYNAMIC : speciesFilter==="dog" ? DOG_BREEDS_DYNAMIC : [...DOG_BREEDS_DYNAMIC,...CAT_BREEDS_DYNAMIC];
  useEffect(()=>{ setFBreed(""); },[speciesFilter]);

  const filteredDeck = deck.filter(p=>{
    if(speciesFilter!=="all"&&p.species!==speciesFilter) return false;
    if(fBreed&&p.breed!==fBreed) return false;
    if(fGender!=="both"&&p.gender!==fGender) return false;
    if(p.age>fAgeMax) return false;
    if(fCity&&p.city!==fCity) return false;
    if(fVacc&&!p.vaccinated) return false;
    if(fPedigree&&!p.pedigree) return false;
    if(search&&!p.name.toLowerCase().includes(search.toLowerCase())&&!p.breed.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const current = filteredDeck[0];
  const next = filteredDeck[1];
  const flash = (t:"like"|"pass"|"save") => { setFeedback(t); setTimeout(()=>setFeedback(null),750); };

  // doLike — just adds to matches, no chat widget opened
  const doLike = useCallback(()=>{
    if(!current) return;
    setSwipeDir("right");
    setTimeout(()=>{
      setLiked(p=>[...p,current.id]);
      setMatches(p=>[...p,{petId:current.id,messages:[]}]);
      setDeck(d=>d.filter(x=>x.id!==current.id));
      setSwipeDir(null);
    },420);
    flash("like");
  },[current]);

  const doPass = useCallback(()=>{
    if(!current) return;
    setSwipeDir("left");
    setTimeout(()=>{ setDeck(d=>d.filter(x=>x.id!==current.id)); setSwipeDir(null); },420);
    flash("pass");
  },[current]);

  const doSave = useCallback(()=>{
    if(!current||saved.includes(current.id)) return;
    setSaved(p=>[...p,current.id]);
    flash("save");
  },[current,saved]);

  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{
      if(e.key==="ArrowRight") doLike();
      if(e.key==="ArrowLeft") doPass();
      if(e.key.toLowerCase()==="s") doSave();
    };
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  },[doLike,doPass,doSave]);

  const sendMsg = (petId:string|number,text:string) => {
    const now = new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
    setMatches(prev=>prev.map(m=>m.petId!==petId?m:{...m,messages:[...m.messages,{id:Date.now(),from:"me",text,time:now}]}));
    setTimeout(()=>{
      const pet=allPets.find(p=>p.id===petId);
      const replies=[`Hi! Thanks for reaching out about ${pet?.name} 🐾`,"We'd love to arrange a meet-up this weekend!","Can you share your pet's health history?",`${pet?.name} is very friendly — I'm sure they'd get along great!`,"What city are you based in? We could meet at a park!"];
      const t=new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
      setMatches(prev=>prev.map(m=>m.petId!==petId?m:{...m,messages:[...m.messages,{id:Date.now()+1,from:"them",text:replies[Math.floor(Math.random()*replies.length)],time:t}]}));
    },1500);
  };

  const removeMatch = (petId:string|number) => {
    setMatches(prev=>prev.filter(m=>m.petId!==petId));
    setLiked(prev=>prev.filter(id=>id!==petId));
    setSaved(prev=>prev.filter(id=>id!==petId));
    if(activeChat===petId) setActiveChat(null);
  };

  const submitMyPet = async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!form.name||!form.breed||!form.age||!form.city||!form.location||!form.photo) return;
    const payload = { name:form.name, species:form.species, breed:form.breed, age:parseInt(form.age,10), gender:form.gender, location:form.location, city:form.city, owner:currentOwner, ownerClerkId:user?.id ?? "", ownerAvatar:ownerAvatar, ownerVerified:Boolean(user), vaccinated:form.vaccinated, pedigree:form.pedigree, photo:form.photo, description:form.description||"Looking for the perfect match!", traits:form.traits.split(",").map(t=>t.trim()).filter(Boolean), weight:form.weight||"—", color:form.color||"—", score:0, healthCerts:form.healthCerts.split(",").map(c=>c.trim()).filter(Boolean), joinedDate:new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"}) };
    try {
      const res = await fetch("/api/pets",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      if(!res.ok) throw new Error("Failed");
      const created = normalizePet(await res.json());
      setMyPet(created); setAllPets(prev=>[created,...prev]); setDeck(prev=>[created,...prev]); setShowForm(false);
      setForm({name:"",species:"dog" as Species,breed:"",age:"",gender:"Male" as "Male"|"Female",city:"",location:"",photo:"",description:"",weight:"",color:"",traits:"",healthCerts:"",vaccinated:true,pedigree:false});
    } catch { alert("Could not save pet. Please try again."); }
  };

  const likedPets = allPets.filter(p=>liked.includes(p.id));
  const savedPets = allPets.filter(p=>saved.includes(p.id));
  const chatPet = activeChat ? allPets.find(p=>p.id===activeChat) : null;
  const chatMatch = activeChat ? matches.find(m=>m.petId===activeChat) : null;
  const resetFilters = () => { setFBreed(""); setFGender("both"); setFAgeMax(12); setFCity(""); setFVacc(false); setFPedigree(false); setSearch(""); };

  if(loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FEF7ED]">
        <div className="text-center"><div className="mb-3 text-2xl">⏳</div><p className="text-gray-600">Loading Breeding listings...</p></div>
      </div>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="min-h-screen bg-[#FEF7ED] bf-body">
        <Header/>

        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400 pt-10 pb-16">
          <div className="absolute inset-0 opacity-[0.07]" style={{backgroundImage:"radial-gradient(circle,white 1px,transparent 1px)",backgroundSize:"26px 26px"}}/>
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl"/>
          <div className="absolute -bottom-24 -left-12 w-72 h-72 rounded-full bg-orange-700/20 blur-3xl"/>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8">
              <div className="text-white">
                <div className="flex items-center gap-2 mb-3 opacity-75"><Heart className="w-4 h-4 fill-white"/><span className="text-xs font-bold uppercase tracking-[.15em]">Breeding Match</span></div>
                <h1 className="bf-display text-5xl sm:text-6xl font-black leading-[1.05] mb-4">Find Your Pet's<br/><em className="not-italic text-amber-200">Perfect Match.</em></h1>
                <p className="text-white/70 text-sm sm:text-base max-w-sm leading-relaxed mb-4">Swipe through verified dog and cat profiles, view health certifications, and connect with trusted owners.</p>
                <div className="flex gap-2 flex-wrap">
                  {([["all","🐾","All Pets"],["dog","🐕","Dogs"],["cat","🐱","Cats"]] as const).map(([sp,em,label])=>(
                    <button key={sp} onClick={()=>setSpeciesFilter(sp)} className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border-2 transition-all",speciesFilter===sp?"bg-white text-orange-600 border-white":"bg-white/15 text-white border-white/30 hover:bg-white/25")}>{em} {label}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                {[{label:"Matches",val:liked.length,Icon:Heart},{label:"Saved",val:savedPets.length,Icon:Bookmark},{label:"In Pool",val:filteredDeck.length,Icon:Users}].map(({label,val,Icon})=>(
                  <div key={label} className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-white text-center min-w-[76px]">
                    <Icon className="w-4 h-4 mx-auto mb-1 fill-white"/>
                    <p className="bf-display text-2xl font-black">{val}</p>
                    <p className="text-[10px] text-white/55 font-semibold uppercase tracking-wider">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 32" preserveAspectRatio="none"><path d="M0,32 C480,0 960,0 1440,32 L1440,32 L0,32 Z" fill="#FEF7ED"/></svg>
        </section>

        {/* TAB BAR */}
        <div className="sticky top-[65px] z-30 bg-[#FEF7ED]/90 backdrop-blur-md border-b border-orange-100/60">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 py-2.5 flex-wrap">
            {[{id:"discover",label:"Discover",Icon:Zap},{id:"matches",label:`Matches${liked.length?` (${liked.length})`:""}`,Icon:Heart}].map(({id,label,Icon})=>(
              <button key={id} onClick={()=>{setView(id as any);setActiveChat(null);}} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",view===id&&activeChat===null?"bg-orange-500 text-white shadow-sm shadow-orange-200":"text-gray-500 hover:bg-orange-50 hover:text-orange-600")}><Icon className="w-4 h-4"/>{label}</button>
            ))}
            <div className="flex gap-1.5 ml-2">
              {([["all","🐾","All"],["dog","🐕","Dogs"],["cat","🐱","Cats"]] as const).map(([sp,em,label])=>(
                <button key={sp} onClick={()=>setSpeciesFilter(sp)} className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all",speciesFilter===sp&&sp==="dog"?"bg-orange-500 text-white border-orange-500":speciesFilter===sp&&sp==="cat"?"bg-purple-500 text-white border-purple-500":speciesFilter===sp&&sp==="all"?"bg-gray-700 text-white border-gray-700":"border-gray-200 text-gray-500 hover:border-gray-300 bg-white")}>{em} {label}</button>
              ))}
            </div>
            <div className="flex-1"/>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name or breed…" className="pl-9 pr-3 py-2 text-sm bg-white border border-orange-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 w-44"/>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-[290px,1fr] gap-8 items-start">

            {/* SIDEBAR */}
            <aside className="space-y-5 lg:sticky lg:top-[130px]">
              {!myPet ? (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 p-6 text-white shadow-lg shadow-orange-200/60">
                  <div className="absolute -top-5 -right-5 w-24 h-24 rounded-full bg-white/10"/>
                  <div className="text-3xl mb-2">🐾</div>
                  <h3 className="bf-display font-black text-xl mb-1">List Your Pet</h3>
                  <p className="text-white/75 text-sm mb-4 leading-relaxed">Add your dog or cat to start receiving match requests.</p>
                  <button onClick={()=>setShowForm(!showForm)} className="w-full bg-white text-orange-500 font-bold py-2.5 rounded-2xl hover:bg-orange-50 transition-colors text-sm flex items-center justify-center gap-2"><Plus className="w-4 h-4"/>{showForm?"Cancel":"Add My Pet"}</button>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-5 border-2 border-emerald-200 shadow-sm bf-pop">
                  <div className="flex items-center gap-2 mb-3"><div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center bf-bnc"><Check className="w-4 h-4 text-white"/></div><span className="font-black text-gray-900">Your Pet Is Live</span></div>
                  <div className="text-5xl text-center mb-2">{myPet.fallbackEmoji}</div>
                  <p className="bf-display font-black text-gray-900 text-center text-xl">{myPet.name}</p>
                  <p className="text-sm text-gray-500 text-center">{myPet.breed} · {myPet.age}yr · {myPet.gender}</p>
                  <p className="text-xs text-gray-400 text-center mt-0.5">{myPet.city}</p>
                  <div className="mt-3 text-xs text-gray-600 space-y-1">
                    <p>Weight: {myPet.weight} · Color: {myPet.color}</p>
                    <p>Vaccinated: {myPet.vaccinated?"Yes":"No"} · Pedigree: {myPet.pedigree?"Yes":"No"}</p>
                    {myPet.traits.length>0&&<p>Traits: {myPet.traits.join(", ")}</p>}
                    {myPet.healthCerts.length>0&&<p>Health: {myPet.healthCerts.join(", ")}</p>}
                  </div>
                  <button onClick={()=>setMyPet(null)} className="w-full mt-4 text-sm text-red-400 hover:text-red-600 font-semibold py-2 rounded-xl hover:bg-red-50 transition-colors">Remove Listing</button>
                </div>
              )}

              {showForm&&!myPet&&(
                <div className="bg-white rounded-3xl p-5 border border-orange-100 shadow-sm bf-up">
                  <h3 className="bf-display font-black text-gray-900 text-lg mb-4">Pet Details</h3>
                  <form onSubmit={submitMyPet} className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Species</label>
                      <div className="flex gap-2">
                        {(["dog","cat"] as Species[]).map(sp=>(
                          <button key={sp} type="button" onClick={()=>setForm({...form,species:sp,breed:""})} className={cn("flex-1 py-2.5 text-sm font-bold rounded-xl border-2 flex items-center justify-center gap-2 transition-all",form.species===sp?sp==="dog"?"bg-orange-500 border-orange-500 text-white":"bg-purple-500 border-purple-500 text-white":"border-gray-200 text-gray-500 hover:border-gray-300")}>{sp==="dog"?"🐕":"🐱"} {sp==="dog"?"Dog":"Cat"}</button>
                        ))}
                      </div>
                    </div>
                    {[{label:"Pet Name",key:"name",type:"text",ph:"e.g. Max"},{label:"Age (yrs)",key:"age",type:"number",ph:"e.g. 3"}].map(({label,key,type,ph})=>(
                      <div key={key}><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">{label}</label><input type={type} value={(form as any)[key]} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={ph} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"/></div>
                    ))}
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Breed</label><select value={form.breed} onChange={e=>setForm({...form,breed:e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"><option value="">Select breed</option>{breedOptions.map(b=><option key={b}>{b}</option>)}</select></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Location</label><input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="e.g. Austin, TX" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"/></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">City</label><select value={form.city} onChange={e=>setForm({...form,city:e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"><option value="">Select city</option>{CITY_OPTIONS.map(c=><option key={c}>{c}</option>)}</select></div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Upload Photo</label>
                      <input type="file" accept="image/*" onChange={async(e)=>{
                        const file=e.target.files?.[0]; if(!file) return;
                        if(!CLOUDINARY_CLOUD_NAME||!CLOUDINARY_UPLOAD_PRESET){setPhotoUploadError("Missing Cloudinary config.");return;}
                        setIsUploadingPhoto(true); setPhotoUploadError(null);
                        try{const fd=new FormData();fd.append("file",file);fd.append("upload_preset",CLOUDINARY_UPLOAD_PRESET);const r=await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,{method:"POST",body:fd});const d=await r.json();if(!r.ok)throw new Error(d.error?.message||"Upload failed");setForm(f=>({...f,photo:d.secure_url}));}catch(err:any){setPhotoUploadError(err?.message||"Upload failed");}finally{setIsUploadingPhoto(false);}
                      }} className="w-full text-sm text-gray-600"/>
                      {isUploadingPhoto&&<p className="text-xs text-blue-600 mt-1">Uploading photo...</p>}
                      {photoUploadError&&<p className="text-xs text-red-600 mt-1">{photoUploadError}</p>}
                      {form.photo&&<img src={form.photo} alt="Uploaded pet" className="mt-2 rounded-xl w-24 h-24 object-cover"/>}
                    </div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Gender</label><div className="flex gap-2">{["Male","Female"].map(g=><button key={g} type="button" onClick={()=>setForm({...form,gender:g as "Male"|"Female"})} className={cn("flex-1 py-2 text-sm font-bold rounded-xl border-2 transition-all",form.gender===g?"bg-orange-500 border-orange-500 text-white":"border-gray-200 text-gray-500 hover:border-orange-300")}>{g}</button>)}</div></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">About</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Short bio…" rows={2} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"/></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Weight</label><input value={form.weight} onChange={e=>setForm({...form,weight:e.target.value})} placeholder="e.g. 28 kg" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"/></div>
                      <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Color</label><input value={form.color} onChange={e=>setForm({...form,color:e.target.value})} placeholder="e.g. Golden" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"/></div>
                    </div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Traits (comma separated)</label><input value={form.traits} onChange={e=>setForm({...form,traits:e.target.value})} placeholder="e.g. Playful, Loyal" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"/></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Health Certificates (comma separated)</label><input value={form.healthCerts} onChange={e=>setForm({...form,healthCerts:e.target.value})} placeholder="e.g. OFA Hips, CERF Eyes" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"/></div>
                    <div className="flex gap-2">
                      <label className="flex-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vaccinated</label>
                      <input type="checkbox" checked={form.vaccinated} onChange={e=>setForm({...form,vaccinated:e.target.checked})} className="mt-2"/>
                      <label className="flex-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pedigree</label>
                      <input type="checkbox" checked={form.pedigree} onChange={e=>setForm({...form,pedigree:e.target.checked})} className="mt-2"/>
                    </div>
                    <button type="submit" className="w-full bg-orange-500 text-white font-bold py-2.5 rounded-2xl hover:bg-orange-600 transition-colors text-sm flex items-center justify-center gap-2"><Check className="w-4 h-4"/> List My Pet</button>
                  </form>
                </div>
              )}

              {/* Filters */}
              <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                <h3 className="bf-display font-black text-gray-900 text-base mb-4 flex items-center gap-2"><span className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center"><Search className="w-3.5 h-3.5 text-orange-500"/></span>Filters</h3>
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Species</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([{sp:"all" as const,em:"🐾",label:"All"},{sp:"dog" as const,em:"🐕",label:"Dogs"},{sp:"cat" as const,em:"🐱",label:"Cats"}]).map(({sp,em,label})=>(
                      <button key={sp} onClick={()=>setSpeciesFilter(sp)} className={cn("flex flex-col items-center gap-1 py-2.5 rounded-2xl border-2 text-xs font-bold transition-all",speciesFilter===sp&&sp==="dog"?"bg-orange-500 border-orange-500 text-white":speciesFilter===sp&&sp==="cat"?"bg-purple-500 border-purple-500 text-white":speciesFilter===sp&&sp==="all"?"bg-gray-800 border-gray-800 text-white":"border-gray-200 text-gray-500 hover:border-gray-300 bg-gray-50")}><span className="text-xl">{em}</span>{label}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Breed</label><select value={fBreed} onChange={e=>setFBreed(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"><option value="">All Breeds</option>{breedOptions.map(b=><option key={b}>{b}</option>)}</select></div>
                  <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Gender</label><div className="flex gap-1.5">{(["both","Male","Female"] as const).map(g=><button key={g} onClick={()=>setFGender(g)} className={cn("flex-1 py-1.5 text-xs font-bold rounded-xl border-2 transition-all",fGender===g?"bg-orange-500 border-orange-500 text-white":"border-gray-200 text-gray-500 hover:border-orange-200")}>{g==="both"?"Any":g}</button>)}</div></div>
                  <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex justify-between block"><span>Max Age</span><span className="text-orange-500">{fAgeMax} yrs</span></label><input type="range" min="1" max="12" value={fAgeMax} onChange={e=>setFAgeMax(+e.target.value)} className="w-full accent-orange-500"/></div>
                  <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">City</label><select value={fCity} onChange={e=>setFCity(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"><option value="">All Cities</option>{ALL_CITIES.map(c=><option key={c}>{c}</option>)}</select></div>
                  <div className="space-y-3 pt-1">
                    {[{label:"Vaccinated only",val:fVacc,set:setFVacc},{label:"Pedigree only",val:fPedigree,set:setFPedigree}].map(({label,val,set})=>(
                      <label key={label} className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-700 font-medium">{label}</span>
                        <div onClick={()=>set(!val)} style={{height:22,width:40}} className={cn("rounded-full relative transition-colors cursor-pointer border-2",val?"bg-orange-500 border-orange-500":"bg-gray-200 border-gray-200")}><div className={cn("absolute top-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform",val?"translate-x-[19px]":"translate-x-[2px]")}/></div>
                      </label>
                    ))}
                  </div>
                  <button onClick={resetFilters} className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-bold text-gray-500 hover:text-orange-500 border border-gray-200 hover:border-orange-200 rounded-2xl transition-colors"><RefreshCw className="w-3.5 h-3.5"/> Reset Filters</button>
                </div>
              </div>

              {savedPets.length>0&&(
                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="bf-display font-black text-gray-900 text-base mb-3 flex items-center gap-2"><Bookmark className="w-4 h-4 text-yellow-500"/> Saved ({savedPets.length})</h3>
                  <div className="space-y-2">
                    {savedPets.map(p=>(
                      <div key={p.id} className="flex items-center gap-3 p-2 rounded-2xl bg-gray-50 hover:bg-orange-50 transition-colors">
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"><PetPhoto pet={p} className="w-full h-full"/></div>
                        <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-900 truncate">{p.name}</p><p className="text-xs text-gray-400 truncate">{p.breed}</p></div>
                        <button onClick={()=>setSaved(prev=>prev.filter(id=>id!==p.id))} className="text-gray-500 hover:text-red-500 rounded-full p-1 transition-colors" aria-label={`Remove ${p.name} from saved`}><X className="w-4 h-4"/></button>
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border",scoreStyle(p.score))}>{p.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            {/* RIGHT CONTENT */}
            <div>
              {/* DISCOVER VIEW */}
              {view==="discover"&&(
                <div className="flex flex-col items-center">
                  {feedback&&(
                    <div className={cn("fixed top-24 left-1/2 -translate-x-1/2 z-50 px-7 py-3 rounded-2xl font-black text-white text-lg shadow-2xl bf-pop pointer-events-none",feedback==="like"?"bg-emerald-500":feedback==="pass"?"bg-red-500":"bg-yellow-500")}>
                      {feedback==="like"?"💚 Liked!":feedback==="pass"?"✕ Passed":"🔖 Saved!"}
                    </div>
                  )}
                  {filteredDeck.length===0?(
                    <div className="w-full max-w-[400px] mt-8">
                      <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-orange-200">
                        <div className="text-7xl mb-4">{speciesFilter==="cat"?"🐱":speciesFilter==="dog"?"🐕":"🐾"}</div>
                        <h3 className="bf-display font-black text-2xl text-gray-900 mb-2">You've Seen Everyone!</h3>
                        <p className="text-gray-400 text-sm mb-6">No pets match your filters. Try adjusting.</p>
                        <button onClick={()=>{setDeck(allPets);resetFilters();}} className="flex items-center gap-2 mx-auto bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-orange-600 transition-colors"><RefreshCw className="w-4 h-4"/> Start Over</button>
                      </div>
                    </div>
                  ):(
                    <>
                      <div className="w-full max-w-[400px] flex items-center justify-between mb-4 px-1">
                        <span className="text-sm font-bold text-gray-400">{allPets.length-deck.length+1} of {allPets.length}</span>
                        <div className="flex gap-1">
                          {Array.from({length:Math.min(8,allPets.length)}).map((_,i)=>{const seen=i<allPets.length-deck.length;const cur=i===allPets.length-deck.length;return <div key={i} className={cn("h-1.5 rounded-full transition-all duration-300",cur?"w-7 bg-orange-500":seen?"w-2 bg-orange-300":"w-2 bg-gray-200")}/>;  })}
                        </div>
                        {current&&<span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full border",scoreStyle(current.score))}>{current.score}% match</span>}
                      </div>
                      <div className="w-full max-w-[400px]">
                        <div className="relative" style={{height:560}}>
                          {next&&<div className="absolute inset-0 bg-white rounded-[28px] shadow-md" style={{transform:"scale(0.93) translateY(20px)",zIndex:1}}/>}
                          {current&&<SwipeCard key={current.id} pet={current} isTop swipeDir={swipeDir} onLike={doLike} onPass={doPass} onSave={doSave} isSaved={saved.includes(current.id)}/>}
                        </div>
                        <div className="flex items-center justify-center gap-4 mt-7">
                          <button onClick={doPass} className="w-16 h-16 rounded-full bg-white border-2 border-red-200 flex items-center justify-center text-red-400 shadow-md hover:shadow-lg hover:scale-110 hover:border-red-400 transition-all"><X className="w-7 h-7"/></button>
                          <button onClick={doSave} className={cn("w-14 h-14 rounded-full border-2 flex items-center justify-center shadow-md hover:shadow-lg hover:scale-110 transition-all",current&&saved.includes(current.id)?"bg-yellow-400 border-yellow-400 text-white":"bg-white border-yellow-300 text-yellow-500 hover:border-yellow-400")}><Bookmark className="w-5 h-5 fill-current"/></button>
                          <button onClick={doLike} className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-300 hover:scale-110 transition-all bf-pls"><Heart className="w-9 h-9 fill-white"/></button>
                          <button onClick={doSave} className="w-14 h-14 rounded-full bg-white border-2 border-sky-200 text-sky-400 flex items-center justify-center shadow-md hover:shadow-lg hover:scale-110 hover:border-sky-400 transition-all"><Star className="w-5 h-5 fill-current"/></button>
                          <button onClick={()=>setDeck(allPets.filter(p=>!liked.includes(p.id)))} className="w-14 h-14 rounded-full bg-white border-2 border-gray-200 text-gray-400 flex items-center justify-center shadow-md hover:shadow-lg hover:scale-110 hover:border-gray-400 transition-all"><RefreshCw className="w-5 h-5"/></button>
                        </div>
                        <p className="text-center text-xs text-gray-300 mt-4 font-medium">← Pass · 💚 Like · 🔖 Save · Drag to swipe</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* MATCHES VIEW */}
              {view==="matches"&&!activeChat&&(
                <div className="bf-up">
                  <div className="mb-6">
                    <h2 className="bf-display font-black text-2xl text-gray-900">Your Matches</h2>
                    <p className="text-gray-400 text-sm mt-0.5">{likedPets.length} pet{likedPets.length!==1?"s":""} liked</p>
                  </div>
                  {likedPets.length===0?(
                    <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-orange-200">
                      <div className="text-6xl mb-4">💔</div>
                      <h3 className="bf-display font-black text-xl text-gray-900 mb-2">No Matches Yet</h3>
                      <p className="text-gray-400 text-sm mb-6">Swipe right on dogs or cats to start matching!</p>
                      <button onClick={()=>setView("discover")} className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-orange-600 transition-colors">Discover Pets</button>
                    </div>
                  ):(
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {likedPets.map((pet,i)=>(
                        <div key={pet.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group bf-up" style={{animationDelay:`${i*55}ms`}}>
                          <div className="relative h-48 overflow-hidden">
                            <PetPhoto pet={pet} className="w-full h-full group-hover:scale-105 transition-transform duration-500"/>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none"/>
                            <button onClick={()=>removeMatch(pet.id)} className="absolute top-3 right-3 z-20 w-6 h-6 rounded-full bg-white/90 text-gray-500 hover:text-red-500 hover:bg-red-100 flex items-center justify-center shadow transition-all"><X className="w-3.5 h-3.5"/></button>
                            <div className={cn("absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow",pet.species==="cat"?"bg-purple-500/90 text-white backdrop-blur-sm":"bg-orange-500/90 text-white backdrop-blur-sm")}>{pet.species==="cat"?"🐱":"🐕"} {pet.species==="cat"?"Cat":"Dog"}</div>
                            <div className={cn("absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-sm bg-white/80",scoreStyle(pet.score))}><Award className="w-3 h-3"/>{pet.score}%</div>
                            {pet.pedigree&&<div className="absolute bottom-3 left-3 bg-yellow-400/90 text-yellow-900 px-2.5 py-1 rounded-full text-xs font-bold shadow flex items-center gap-1 backdrop-blur-sm"><Trophy className="w-3 h-3"/> Pedigree</div>}
                          </div>
                          <div className="p-5">
                            <div className="flex items-start justify-between mb-1.5">
                              <div><h3 className="bf-display font-black text-xl text-gray-900 leading-none">{pet.name}</h3><p className={cn("font-semibold text-sm mt-0.5",pet.species==="cat"?"text-purple-500":"text-orange-500")}>{pet.breed}</p></div>
                              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">{pet.age}yr · {pet.gender}</span>
                            </div>
                            <div className="space-y-1 text-xs text-gray-400 mb-3">
                              <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-orange-400"/>{pet.location}</div>
                              <div className="flex items-center gap-2">
                                {pet.ownerAvatar?.startsWith("http")?<img src={pet.ownerAvatar} alt={pet.owner} className="w-5 h-5 rounded-full object-cover"/>:<span className="text-base">{pet.ownerAvatar}</span>}
                                <span className="font-semibold text-gray-600">{pet.owner}</span>
                                {pet.ownerVerified&&<span className="bg-orange-50 text-orange-500 px-1.5 py-0.5 rounded-full text-[10px] font-bold">✓ Verified</span>}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-3">{pet.traits.slice(0,3).map(t=><span key={t} className={cn("px-2 py-0.5 rounded-full text-xs font-semibold",pet.species==="cat"?"bg-purple-50 text-purple-600":"bg-orange-50 text-orange-600")}>{t}</span>)}</div>
                            {pet.healthCerts.length>0&&<div className="flex flex-wrap gap-1 mb-4">{pet.healthCerts.slice(0,2).map(c=><span key={c} className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-medium border border-emerald-100">✓ {c}</span>)}</div>}

                            <button
                              onClick={() => navigate("/chat", {
                                state: {
                                  autoOpen: {
                                    petId:       String(pet.id),
                                    petName:     pet.name,
                                    petPhoto:    pet.photo,
                                    // ROOT CAUSE FIX: use ownerClerkId (real Clerk user ID)
                                    // so the chat room's isRoomMember() check passes
                                    // and the owner can actually send/receive messages.
                                    ownerId:     pet.ownerClerkId ?? pet.ownerId ?? "",
                                    ownerName:   pet.owner,
                                    ownerAvatar: pet.ownerAvatar,
                                  }
                                }
                              })}
                              className="w-full font-bold py-2.5 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all shadow-sm bg-gradient-to-r from-orange-500 to-amber-400 text-white hover:from-orange-600 hover:to-amber-500 shadow-orange-200"
                            >
                              <MessageSquare className="w-4 h-4"/>
                              Message {pet.owner}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Legacy internal chat */}
              {view==="matches"&&activeChat&&chatPet&&chatMatch&&(
                <div className="h-[660px] bf-up">
                  <ChatPanel pet={chatPet} match={chatMatch} onSend={t=>sendMsg(chatPet.id,t)} onClose={()=>setActiveChat(null)}/>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

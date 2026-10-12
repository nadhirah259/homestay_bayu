// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calendar, MapPin, Phone, Star, Wifi, Tv, Car, 
  Wind, Bath, BedDouble, CheckCircle2, 
  ChevronLeft, ChevronRight, X, LogIn, 
  Settings, CheckSquare, Droplets, Shirt, Fan, Microwave,
  Bot, Send, MessageSquare, Copy, Sparkles, Loader2
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";

// Konfigurasi Firebase Homestay Bayu (Rasmi)
const firebaseConfig = {
  apiKey: "AIzaSyCMFSpLb6OMm6z2CHZlZnn4IYzgf31am4g",
  authDomain: "homestay-bayu.firebaseapp.com",
  projectId: "homestay-bayu",
  storageBucket: "homestay-bayu.firebasestorage.app",
  messagingSenderId: "30700380449",
  appId: "1:30700380449:web:0b9766be3bc4fe1a02de60"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const COL_BOOKINGS = 'bookings';
const COL_SETTINGS = 'settings';
const COL_BLOCKED_DATES = 'blocked_dates';
const GEMINI_API_KEY = "AQ.Ab8RN6IdHfAh-eYvcianxNj13w4MqlX8gDFzUsE0r2bnShjIsg";

// Bantuan Utiliti Tarikh
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
const formatDate = (date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  return [year, month, day].join('-');
};
const addDays = (dateStr, days) => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
};

export default function HomestayApp() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [settings, setSettings] = useState({
    weekdayPrice: 260,
    weekendPrice: 270,
    promoPrice: 250,
    ownerPhone: '601116462999',
    address: 'PKNS Residensi Advena, Jalan Dawai 16/2,\nSeksyen 16,\n40200 Shah Alam.',
    googleMapsLink: 'https://maps.app.goo.gl/xeFn4cgCHJqxwxcM7'
  });

  useEffect(() => {
    // Log masuk Firebase (Abaikan ralat jika Anonymous belum berfungsi penuh)
    signInAnonymously(auth).then((userCred) => {
      setUser(userCred.user);
    }).catch((error) => {
       console.warn("Makluman: Meneruskan sambungan tanpa pengesahan mandatori.", error);
    });

    const unsubSettings = onSnapshot(doc(db, COL_SETTINGS, 'main_config'), (docSnap) => {
        if (docSnap.exists()) setSettings(prev => ({ ...prev, ...docSnap.data() }));
    }, () => {});

    const unsubBookings = onSnapshot(collection(db, COL_BOOKINGS), (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setBookings(data);
    }, () => {});

    const unsubBlocked = onSnapshot(collection(db, COL_BLOCKED_DATES), (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setBlockedDates(data);
        setLoadingInitial(false);
    }, () => {
        setLoadingInitial(false);
    });

    return () => {
      unsubSettings();
      unsubBookings();
      unsubBlocked();
    };
  }, []);

  const unavailableDates = useMemo(() => {
    const dates = new Set();
    blockedDates.forEach(b => dates.add(b.date));
    bookings.forEach(booking => {
      if (booking.status !== 'rejected' && booking.status !== 'cancelled') {
        let currentDate = booking.checkIn;
        while (currentDate < booking.checkOut) {
          dates.add(currentDate);
          currentDate = addDays(currentDate, 1);
        }
      }
    });
    return dates;
  }, [bookings, blockedDates]);

  if (loadingInitial) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div></div>;
  }

  return (
    <div className="font-sans text-stone-800 bg-stone-50 min-h-screen">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center cursor-pointer group" onClick={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              <span className="font-serif text-3xl font-bold text-stone-800 tracking-tight group-hover:text-stone-600 transition-colors">Homestay Bayu</span>
            </div>
            <div className="hidden md:flex space-x-8 items-center">
              {currentView === 'home' ? (
                <>
                  <a href="#galeri" className="text-stone-600 hover:text-stone-900 transition font-medium">Galeri</a>
                  <a href="#kemudahan" className="text-stone-600 hover:text-stone-900 transition font-medium">Kemudahan</a>
                  <a href="#tempah" className="px-6 py-2.5 bg-stone-800 text-white rounded-full hover:bg-stone-700 transition font-medium">Tempah Sekarang</a>
                </>
              ) : (
                <button onClick={() => setCurrentView('home')} className="text-stone-600 hover:text-stone-900 font-medium">Kembali ke Laman Utama</button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main>
        {currentView === 'home' && <ClientHome settings={settings} unavailableDates={unavailableDates} db={db} user={user} />}
        {currentView === 'admin' && (
          <AdminPanel 
            settings={settings} bookings={bookings} blockedDates={blockedDates}
            isAdminLoggedIn={isAdminLoggedIn} setIsAdminLoggedIn={setIsAdminLoggedIn} db={db}
          />
        )}
      </main>

      <footer className="bg-stone-900 text-stone-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 text-center md:text-left">
            <h3 className="font-serif text-xl text-white mb-2">Homestay Bayu</h3>
            <p>Penginapan Selesa, Kenangan Bermakna.</p>
          </div>
          <div className="flex space-x-4">
            <p className="text-sm cursor-pointer select-none" onDoubleClick={() => setCurrentView('admin')}>
              &copy; {new Date().getFullYear()} Homestay Bayu. Hak Cipta Terpelihara.
            </p>
          </div>
        </div>
      </footer>

      <AIChatbot settings={settings} />

      <a href={`https://www.wasap.my/${settings.ownerPhone}/HomestayBayu`} target="_blank" rel="noreferrer" className="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-[#25D366] text-white p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-2xl hover:scale-110 transition-all duration-300 z-50 flex items-center justify-center group" aria-label="Hubungi kami di WhatsApp">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" viewBox="0 0 16 16">
          <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.622 2.94-6.562 6.56-6.562 1.758 0 3.411.685 4.653 1.93 1.241 1.244 1.926 2.895 1.926 4.653-.004 3.622-2.94 6.562-6.56 6.562zm3.593-4.908c-.197-.099-1.17-.578-1.352-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
        </svg>
        <span className="absolute right-full mr-4 bg-white text-stone-800 text-sm font-semibold py-2 px-4 rounded-xl shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Tanya kami di WhatsApp!
        </span>
      </a>
    </div>
  );
}

function ClientHome({ settings, unavailableDates, db, user }) {
  return (
    <div className="animate-fade-in">
      <div className="relative h-[80vh] flex items-center justify-center bg-stone-900 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://i.postimg.cc/dtRSW5zK/photo-2026-10-10-18-00-22.jpg" alt="Homestay Bayu" className="w-full h-full object-cover opacity-60" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16">
          <span className="inline-block py-1 px-3 rounded-full bg-stone-800/50 backdrop-blur-md text-white text-sm font-medium tracking-wider mb-6 uppercase">Selamat Datang</span>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-tight drop-shadow-lg text-white">Percutian Selesa Bersama Keluarga</h1>
          <p className="text-xl md:text-2xl text-stone-200 mb-10 font-light text-shadow">Alami penginapan eksklusif di Homestay Bayu.</p>
          <a href="#tempah" className="inline-block bg-white text-stone-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-stone-100 hover:scale-105 transition-all shadow-xl">Semak Kekosongan</a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-stone-100 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center">
            <div><h3 className="text-gray-500 mb-1">Hari Biasa</h3><p className="text-3xl font-bold text-stone-800">RM{settings.weekdayPrice}<span className="text-lg font-normal text-gray-500"> /malam</span></p></div>
            <div className="py-4 bg-stone-50 rounded-xl mx-2 md:mx-0 p-4 shadow-sm border border-stone-100">
              <h3 className="text-amber-600 font-semibold mb-1 flex items-center justify-center gap-2"><Star size={18} /> Promosi Penginapan Lama</h3>
              <p className="text-2xl font-bold text-stone-800">RM{settings.promoPrice}<span className="text-base font-normal text-gray-500"> /malam</span></p>
              <p className="text-sm text-gray-500 mt-1">Untuk tempahan 2 malam & ke atas</p>
            </div>
            <div><h3 className="text-gray-500 mb-1">Hujung Minggu & Cuti</h3><p className="text-3xl font-bold text-stone-800">RM{settings.weekendPrice}<span className="text-lg font-normal text-gray-500"> /malam</span></p></div>
          </div>
        </div>

        <div id="galeri" className="mb-24 pt-10">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-serif text-4xl font-bold text-stone-800 mb-3">Galeri Penginapan</h2>
              <p className="text-stone-500 text-lg">Gambaran sebenar keselesaan yang menanti anda.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <img src="https://i.postimg.cc/ncKwd3N0/photo-2026-10-10-17-59-14.jpg" alt="Ruang Tamu" className="rounded-2xl h-64 w-full object-cover shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => window.open('https://i.postimg.cc/ncKwd3N0/photo-2026-10-10-17-59-14.jpg', '_blank')} />
            <img src="https://i.postimg.cc/c475DFVq/photo-2026-10-10-17-59-26.jpg" alt="Ruang Makan" className="rounded-2xl h-64 w-full object-cover shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => window.open('https://i.postimg.cc/c475DFVq/photo-2026-10-10-17-59-26.jpg', '_blank')} />
            <img src="https://i.postimg.cc/28dXH0gP/photo-2026-10-10-17-59-20.jpg" alt="Dapur" className="rounded-2xl h-64 w-full object-cover shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => window.open('https://i.postimg.cc/28dXH0gP/photo-2026-10-10-17-59-20.jpg', '_blank')} />
            <img src="https://i.postimg.cc/kXPpF0Y0/photo-2026-10-10-17-59-09.jpg" alt="Bilik Tidur Utama" className="rounded-2xl h-64 w-full object-cover shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => window.open('https://i.postimg.cc/kXPpF0Y0/photo-2026-10-10-17-59-09.jpg', '_blank')} />
            <img src="https://i.postimg.cc/RVxDQkpL/2026-10-10-17-58-48.jpg" alt="Bilik Tidur 2" className="rounded-2xl h-64 w-full object-cover shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => window.open('https://i.postimg.cc/RVxDQkpL/2026-10-10-17-58-48.jpg', '_blank')} />
            <img src="https://i.postimg.cc/YqBsf5DZ/photo-2026-10-10-17-59-12.jpg" alt="Bilik Tidur 3" className="rounded-2xl h-64 w-full object-cover shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => window.open('https://i.postimg.cc/YqBsf5DZ/photo-2026-10-10-17-59-12.jpg', '_blank')} />
            <img src="https://i.postimg.cc/hPR5bkZY/photo-2026-10-10-17-59-06.jpg" alt="Bilik Air 1" className="rounded-2xl h-64 w-full object-cover shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => window.open('https://i.postimg.cc/hPR5bkZY/photo-2026-10-10-17-59-06.jpg', '_blank')} />
            <img src="https://i.postimg.cc/tCdmrBLQ/photo-2026-10-10-18-16-31.jpg" alt="Bilik Air 2" className="rounded-2xl h-64 w-full object-cover shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => window.open('https://i.postimg.cc/tCdmrBLQ/photo-2026-10-10-18-16-31.jpg', '_blank')} />
            <img src="https://i.postimg.cc/hP83C2Hc/photo-2026-10-10-18-00-35.jpg" alt="Kemudahan Taman" className="rounded-2xl h-64 w-full object-cover shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => window.open('https://i.postimg.cc/hP83C2Hc/photo-2026-10-10-18-00-35.jpg', '_blank')} />
            <img src="https://i.postimg.cc/Wbmf95QV/photo-2026-10-10-18-00-31.jpg" alt="Kemudahan Rekreasi" className="rounded-2xl h-64 w-full object-cover shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => window.open('https://i.postimg.cc/Wbmf95QV/photo-2026-10-10-18-00-31.jpg', '_blank')} />
            <img src="https://i.postimg.cc/150YWvbk/photo-2026-10-10-17-59-23.jpg" alt="Kemudahan Gimnasium" className="rounded-2xl h-64 w-full object-cover shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => window.open('https://i.postimg.cc/150YWvbk/photo-2026-10-10-17-59-23.jpg', '_blank')} />
            <img src="https://i.postimg.cc/GhPSMX6V/photo-2026-10-10-17-59-18.jpg" alt="Kemudahan Surau/Bilik" className="rounded-2xl h-64 w-full object-cover shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => window.open('https://i.postimg.cc/GhPSMX6V/photo-2026-10-10-17-59-18.jpg', '_blank')} />
          </div>
        </div>

        <div id="kemudahan" className="mb-24 pt-10">
          <h2 className="font-serif text-4xl font-bold text-stone-800 mb-10 text-center">Kemudahan Disediakan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AmenityCard icon={<BedDouble size={28}/>} title="3 Bilik Tidur" />
            <AmenityCard icon={<Wind size={28}/>} title="Penghawa Dingin" />
            <AmenityCard icon={<Wifi size={28}/>} title="WiFi Pantas" />
            <AmenityCard icon={<Tv size={28}/>} title="Smart TV" />
            <AmenityCard icon={<Droplets size={28}/>} title="Penapis Air" />
            <AmenityCard icon={<Shirt size={28}/>} title="Seterika" />
            <AmenityCard icon={<Fan size={28}/>} title="Pengering Rambut" />
            <AmenityCard icon={<Microwave size={28}/>} title="Ketuhar Mikro" />
            <AmenityCard icon={<Bath size={28}/>} title="2 Bilik Air" />
            <AmenityCard icon={<Car size={28}/>} title="Parkir Percuma" />
          </div>
        </div>

        <div className="mb-24">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-stone-100 flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-1">
              <h2 className="font-serif text-3xl font-bold text-stone-800 mb-4">Lokasi Strategik</h2>
              <p className="text-stone-600 mt-2 leading-relaxed whitespace-pre-line mb-6 text-lg">{settings.address}</p>
              <a href={settings.googleMapsLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-6 py-3 bg-stone-100 text-stone-800 rounded-full font-medium hover:bg-stone-200 transition">
                <MapPin size={20} className="mr-2" /> Buka di Google Maps
              </a>
            </div>
            <div className="flex-1 w-full relative h-64 rounded-2xl overflow-hidden shadow-inner group">
              <div className="absolute inset-0 bg-stone-200 flex flex-col items-center justify-center text-stone-500">
                 <MapPin size={48} className="mb-2 opacity-50" />
                 <span>Peta Interaktif (Sila klik pautan)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-24">
          <h2 className="font-serif text-4xl font-bold text-stone-800 mb-10 text-center">Apa Kata Tetamu Kami</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ReviewCard name="Hazman" date="2 Mei 2026" text="Rumah cantik, senang berurusan." stars={5} />
            <ReviewCard name="Fadil" date="8 Mei 2026" text="Homestay cantik dan bersih, kami puas hati." stars={5} />
            <ReviewCard name="Basheerah" date="16 Mei 2026" text="Terima kasih, BTW Homestay cantik bersih sangat dan selesa." stars={5} />
          </div>
        </div>

        <div id="tempah" className="pt-10 scroll-m-20">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-stone-100 flex flex-col lg:flex-row gap-12">
            <div className="flex-1">
              <h2 className="font-serif text-3xl font-bold text-stone-800 mb-2">Tempah Penginapan Anda</h2>
              <p className="text-gray-500 mb-8 text-sm">Tarikh berwarna kelabu telah ditempah. Sila pilih tarikh masuk dan keluar.</p>
               <BookingSystem settings={settings} unavailableDates={unavailableDates} db={db} user={user} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AmenityCard({ icon, title }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex flex-col items-center justify-center text-center hover:shadow-md transition group">
      <div className="text-stone-400 group-hover:text-stone-800 transition-colors mb-3">{icon}</div>
      <h4 className="font-medium text-stone-800">{title}</h4>
    </div>
  );
}

function ReviewCard({ name, date, text, stars }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex flex-col h-full">
      <div className="flex text-amber-400 mb-4">{[...Array(stars)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}</div>
      <p className="text-stone-600 mb-6 italic flex-grow">"{text}"</p>
      <div className="mt-auto"><h5 className="font-bold text-stone-800">{name}</h5><span className="text-sm text-stone-400">{date}</span></div>
    </div>
  );
}

function BookingSystem({ settings, unavailableDates, db, user }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', phone: '', adults: 2, children: 0, time: '', plateNo: '', notes: '' });

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = formatDate(today);
  const isDateUnavailable = (dateStr) => unavailableDates.has(dateStr);

  const handleDateClick = (dateStr) => {
    if (dateStr < todayStr || isDateUnavailable(dateStr)) return;
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(dateStr); setCheckOut(null);
    } else {
      if (dateStr > checkIn) {
        let current = checkIn; let isValid = true;
        while (current < dateStr) { if (isDateUnavailable(current)) { isValid = false; break; } current = addDays(current, 1); }
        if (isValid) setCheckOut(dateStr); else { setCheckIn(dateStr); setCheckOut(null); }
      } else { setCheckIn(dateStr); }
    }
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear(); const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month); const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    ['Aha', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'].forEach(day => {
      days.push(<div key={`h-${day}`} className="text-center text-xs font-semibold text-gray-400 py-2">{day}</div>);
    });
    for (let i = 0; i < firstDay; i++) { days.push(<div key={`empty-${i}`} className="p-2"></div>); }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = formatDate(new Date(year, month, i));
      const isPast = dateStr < todayStr;
      const disabled = isPast || isDateUnavailable(dateStr);
      let bgClass = "bg-white border border-stone-100"; let textClass = "text-stone-700";
      if (disabled) { bgClass = "bg-stone-100 border-none opacity-50"; textClass = "text-stone-400 line-through"; }
      else { bgClass = "hover:border-stone-800 hover:shadow-sm cursor-pointer"; }

      if (checkIn === dateStr || checkOut === dateStr) { bgClass = "bg-stone-800 border-stone-800 text-white"; textClass = "text-white font-bold"; }
      else if (checkIn && checkOut && dateStr > checkIn && dateStr < checkOut) { bgClass = "bg-stone-200 border-stone-200"; textClass = "text-stone-800"; }
      else if (checkIn && !checkOut && hoverDate && dateStr > checkIn && dateStr <= hoverDate) {
         let valid = true; let temp = checkIn;
         while(temp <= dateStr) { if (isDateUnavailable(temp)) { valid = false; break; } temp = addDays(temp, 1); }
         if (valid) bgClass = "bg-stone-100 border-stone-200";
      }
      days.push(
        <button key={dateStr} disabled={disabled} onClick={() => handleDateClick(dateStr)} onMouseEnter={() => setHoverDate(dateStr)} onMouseLeave={() => setHoverDate(null)} className={`h-10 w-full rounded-lg text-sm flex items-center justify-center transition-all ${bgClass} ${textClass}`}>{i}</button>
      );
    }
    return days;
  };

  const calculatePrice = () => {
    if (!checkIn || !checkOut) return { nights: 0, total: 0, items: [] };
    let current = checkIn; let nights = 0; let total = 0; const items = [];
    while (current < checkOut) {
      const d = new Date(current); const dayOfWeek = d.getDay();
      const isWeekend = (dayOfWeek === 5 || dayOfWeek === 6);
      let priceForNight = isWeekend ? settings.weekendPrice : settings.weekdayPrice;
      let label = isWeekend ? "Hujung Minggu" : "Hari Biasa";
      items.push({ date: current, label, price: priceForNight });
      nights++; current = addDays(current, 1);
    }
    if (nights >= 2) { total = nights * settings.promoPrice; items.forEach(item => { item.price = settings.promoPrice; item.label = "Harga Promosi"; }); }
    else { total = items.reduce((sum, item) => sum + item.price, 0); }
    return { nights, total, items };
  };

  const pricing = calculatePrice();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const bookingData = { ...formData, checkIn, checkOut, nights: pricing.nights, totalPrice: pricing.total, status: 'pending', createdAt: new Date().toISOString() };
    if (true) {
      try {
        await addDoc(collection(db, COL_BOOKINGS), bookingData);
        
        const message = `Helo Homestay Bayu!

Saya ingin mengesahkan tempahan saya:
Nama: ${formData.name}
No Tel: ${formData.phone}

Tarikh Masuk: ${checkIn} (Anggaran ${formData.time || '15:00'})
Tarikh Keluar: ${checkOut}
Jumlah Malam: ${pricing.nights}
Tetamu: ${formData.adults} Dewasa, ${formData.children} Kanak-kanak
No Plat Kenderaan: ${formData.plateNo || '-'}

Harga Keseluruhan: RM ${pricing.total}

Nota Tambahan: ${formData.notes || '-'}`;

const phone = String(settings.ownerPhone).replace(/\D/g, '');

const whatsappUrl =
  `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

window.location.href = whatsappUrl;

setStep(3);

      } catch (err) { console.error(err); }
    }
  };

  if (step === 1) {
    return (
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-stone-800">{currentDate.toLocaleString('ms-MY', { month: 'long', year: 'numeric' })}</h3>
          <div className="flex space-x-2">
            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-stone-100 text-stone-600"><ChevronLeft size={20}/></button>
            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-stone-100 text-stone-600"><ChevronRight size={20}/></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-4">{renderCalendarDays()}</div>
        
        {checkIn && checkOut && (
          <div className="mt-6 p-6 bg-stone-50 rounded-2xl border border-stone-200">
            <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Masuk:</span> <span className="font-medium text-stone-800">{checkIn}</span></div>
            <div className="flex justify-between text-sm mb-4"><span className="text-gray-600">Keluar:</span> <span className="font-medium text-stone-800">{checkOut}</span></div>
            {pricing.nights > 0 && (
              <div className="pt-3 border-t border-gray-200">
                 <div className="flex justify-between items-center mb-1">
                   <span className="text-stone-800 font-medium">{pricing.nights} Malam</span>
                   <span className="font-bold text-lg text-stone-900">RM {pricing.total}</span>
                 </div>
                 {pricing.nights >= 2 && <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md">Promosi RM{settings.promoPrice}/malam diaktifkan!</span>}
              </div>
            )}
            <button onClick={() => setStep(2)} className="w-full mt-6 py-3 bg-stone-800 text-white rounded-xl font-bold hover:bg-stone-700 transition">Teruskan Pengisian Borang</button>
          </div>
        )}
      </div>
    );
  }

  if (step === 2) {
    return (
      <form onSubmit={handleSubmit} className="animate-fade-in space-y-5">
        <button type="button" onClick={() => setStep(1)} className="flex items-center text-sm text-stone-500 hover:text-stone-800 mb-6 font-medium"><ChevronLeft size={16} className="mr-1" /> Kembali ke Kalendar</button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className="block text-sm font-medium text-stone-700 mb-1">Nama Penuh</label><input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full border-gray-300 rounded-xl p-3 bg-stone-50 border focus:ring-2 focus:ring-stone-500 outline-none" /></div>
          <div><label className="block text-sm font-medium text-stone-700 mb-1">No. Telefon / WhatsApp</label><input required type="tel" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full border-gray-300 rounded-xl p-3 bg-stone-50 border focus:ring-2 focus:ring-stone-500 outline-none" /></div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Bil. Dewasa</label>
            <div className="flex border border-gray-300 rounded-xl overflow-hidden bg-stone-50">
              <button type="button" onClick={()=>setFormData(p => ({...p, adults: Math.max(1, p.adults - 1)}))} className="px-4 py-3 bg-stone-100 hover:bg-stone-200 font-bold text-stone-600">-</button>
              <input type="number" readOnly value={formData.adults} className="w-full text-center bg-transparent border-none p-3 font-medium outline-none" />
              <button type="button" onClick={()=>setFormData(p => ({...p, adults: p.adults + 1}))} className="px-4 py-3 bg-stone-100 hover:bg-stone-200 font-bold text-stone-600">+</button>
            </div>
          </div>
          <div>
             <label className="block text-sm font-medium text-stone-700 mb-1">Bil. Kanak-kanak</label>
             <div className="flex border border-gray-300 rounded-xl overflow-hidden bg-stone-50">
              <button type="button" onClick={()=>setFormData(p => ({...p, children: Math.max(0, p.children - 1)}))} className="px-4 py-3 bg-stone-100 hover:bg-stone-200 font-bold text-stone-600">-</button>
              <input type="number" readOnly value={formData.children} className="w-full text-center bg-transparent border-none p-3 font-medium outline-none" />
              <button type="button" onClick={()=>setFormData(p => ({...p, children: p.children + 1}))} className="px-4 py-3 bg-stone-100 hover:bg-stone-200 font-bold text-stone-600">+</button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           <div><label className="block text-sm font-medium text-stone-700 mb-1">Anggaran Waktu Tiba (ETA)</label><input type="time" value={formData.time} onChange={e=>setFormData({...formData, time: e.target.value})} className="w-full border-gray-300 rounded-xl p-3 bg-stone-50 border focus:ring-2 focus:ring-stone-500 outline-none" /></div>
           <div><label className="block text-sm font-medium text-stone-700 mb-1">No. Plat Kenderaan (Pilihan)</label><input type="text" placeholder="Contoh: BXY 1234" value={formData.plateNo} onChange={e=>setFormData({...formData, plateNo: e.target.value})} className="w-full border-gray-300 rounded-xl p-3 bg-stone-50 border focus:ring-2 focus:ring-stone-500 outline-none" /></div>
        </div>
        <div><label className="block text-sm font-medium text-stone-700 mb-1">Nota Tambahan (Pilihan)</label><textarea rows="2" value={formData.notes} onChange={e=>setFormData({...formData, notes: e.target.value})} className="w-full border-gray-300 rounded-xl p-3 bg-stone-50 border focus:ring-2 focus:ring-stone-500 outline-none" placeholder="Sebarang permintaan khusus..."></textarea></div>
        <div className="mt-8 p-6 bg-stone-800 text-white rounded-2xl shadow-lg">
          <div className="flex justify-between text-sm mb-2 opacity-80"><span>{checkIn} hingga {checkOut}</span> <span>{pricing.nights} Malam</span></div>
          <div className="flex justify-between font-bold text-2xl pt-4 border-t border-stone-600"><span>Jumlah Bayaran:</span><span>RM {pricing.total}</span></div>
        </div>
        <button type="submit" className="w-full py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#20bd5a] shadow-md transition flex items-center justify-center">Hantar ke WhatsApp <ChevronRight className="ml-2" size={20}/></button>
      </form>
    );
  }

  if (step === 3) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-stone-800 mb-2">Tempahan Direkodkan!</h3>
        <p className="text-stone-500 mb-8 max-w-sm mx-auto">Sila lengkapkan perbualan di WhatsApp untuk pengesahan pembayaran dan pendaftaran homestay.</p>
        <button onClick={() => { setStep(1); setCheckIn(null); setCheckOut(null); setFormData({name: '', phone: '', adults: 2, children: 0, time: '', plateNo: '', notes: ''}); }} className="px-8 py-3 bg-stone-100 text-stone-800 rounded-full font-medium hover:bg-stone-200 transition">Buat Tempahan Baharu</button>
      </div>
    );
  }
}

function AIChatbot({ settings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'model', text: 'Hai! Saya Bayu, pembantu maya AI anda. Ada apa-apa soalan mengenai homestay kami?' }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !GEMINI_API_KEY) return;
    const userText = input.trim();
    const newMessages = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages); setInput(''); setIsTyping(true);

    const systemPrompt = `Anda adalah "Bayu", pembantu maya yang mesra untuk Homestay Bayu. 
    Maklumat Homestay Bayu: Lokasi: ${settings.address}, Harga: RM${settings.weekdayPrice} semalam (Hari Biasa), RM${settings.weekendPrice} semalam (Hujung Minggu/Cuti). Promosi: RM${settings.promoPrice} semalam jika tempah 2 malam ke atas.
    Sila jawab soalan pelanggan dengan ringkas dan mesra dalam Bahasa Melayu.`;

    try {
      const formattedHistory = newMessages.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] }));
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: systemPrompt }] }, ...formattedHistory] })
      });
      const data = await response.json();
      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, sistem sedang sibuk. Sila hubungi tuan rumah melalui WhatsApp.";
      setMessages(prev => [...prev, { role: 'model', text: aiReply }]);
    } catch (error) { setMessages(prev => [...prev, { role: 'model', text: "Maaf, ralat AI berlaku." }]); }
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-24 right-6 md:bottom-28 md:right-10 z-50">
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 h-[450px] flex flex-col overflow-hidden border border-stone-200 animate-fade-in mb-4">
          <div className="bg-stone-900 text-white p-4 flex justify-between items-center">
            <div className="flex items-center"><Bot size={20} className="mr-2 text-stone-300" /><h3 className="font-bold">Tanya AI Bayu</h3></div>
            <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-white transition"><X size={20}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${msg.role === 'user' ? 'bg-stone-800 text-white rounded-br-none' : 'bg-white border border-stone-200 text-stone-700 rounded-bl-none whitespace-pre-line'}`}>{msg.text}</div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center space-x-1">
                  <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 bg-white border-t border-stone-100 flex items-center">
            <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="Tanya soalan..." className="flex-1 bg-stone-100 border-none rounded-full px-4 py-2 text-sm outline-none" />
            <button onClick={handleSend} disabled={isTyping} className="ml-2 p-2 bg-stone-800 text-white rounded-full disabled:opacity-50"><Send size={16} /></button>
          </div>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className="bg-stone-900 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform ml-auto block" aria-label="Buka Sembang AI">
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
}

function AdminPanel({ settings, bookings, blockedDates, isAdminLoggedIn, setIsAdminLoggedIn, db }) {
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState('bookings');

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center animate-fade-in p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-stone-100 text-center">
          <LogIn className="w-16 h-16 mx-auto text-stone-300 mb-6" />
          <h2 className="text-2xl font-bold mb-6 text-stone-800">Panel Pemilik</h2>
          <input type="password" placeholder="Masukkan PIN Admin" value={pin} onChange={e => setPin(e.target.value)} onKeyPress={e => e.key === 'Enter' && (pin === 'admin123' && setIsAdminLoggedIn(true))} className="w-full text-center text-lg p-3 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-stone-800 outline-none" />
          <button onClick={() => pin === 'admin123' ? setIsAdminLoggedIn(true) : alert('PIN Salah')} className="w-full py-3 bg-stone-800 text-white rounded-xl font-bold hover:bg-stone-700 transition">Log Masuk</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row gap-8 animate-fade-in">
       <div className="w-full md:w-64 space-y-2">
         <div className="p-4 bg-stone-900 text-white rounded-2xl mb-6 shadow-lg"><p className="font-medium">Selamat kembali,</p><h3 className="text-xl font-bold font-serif">Admin Bayu</h3></div>
         <nav className="space-y-1">
           <button onClick={()=>setActiveTab('bookings')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center font-medium transition ${activeTab==='bookings'?'bg-stone-200 text-stone-900':'text-stone-600 hover:bg-stone-100'}`}><CheckSquare size={18} className="mr-3"/> Senarai Tempahan</button>
           <button onClick={()=>setActiveTab('calendar')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center font-medium transition ${activeTab==='calendar'?'bg-stone-200 text-stone-900':'text-stone-600 hover:bg-stone-100'}`}><Calendar size={18} className="mr-3"/> Urus Kalendar</button>
           <button onClick={()=>setActiveTab('settings')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center font-medium transition ${activeTab==='settings'?'bg-stone-200 text-stone-900':'text-stone-600 hover:bg-stone-100'}`}><Settings size={18} className="mr-3"/> Tetapan Harga</button>
         </nav>
       </div>
       <div className="flex-1 bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-stone-100 min-h-[60vh]">
         {activeTab === 'bookings' && <AdminBookings bookings={bookings} db={db} />}
         {activeTab === 'calendar' && <AdminCalendar blockedDates={blockedDates} bookings={bookings} db={db} />}
         {activeTab === 'settings' && <AdminSettings initialSettings={settings} db={db} />}
       </div>
    </div>
  );
}

function AdminBookings({ bookings, db }) {
  const [aiReplyBookingId, setAiReplyBookingId] = useState(null);
  const [aiReplyText, setAiReplyText] = useState("");
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);

  const updateStatus = async (id, status) => { try { await updateDoc(doc(db, COL_BOOKINGS, id), { status }); } catch(e) {} };
  const deleteBooking = async (id) => { if(window.confirm('Padam tempahan ini secara kekal?')) { try { await deleteDoc(doc(db, COL_BOOKINGS, id)); } catch(e) {} } };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-md text-xs font-bold border border-amber-200">Menunggu</span>;
      case 'confirmed': return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs font-bold border border-emerald-200">Disahkan</span>;
      case 'rejected': return <span className="px-2 py-1 bg-rose-100 text-rose-800 rounded-md text-xs font-bold border border-rose-200">Ditolak</span>;
      default: return null;
    }
  };

  const generateAIReply = async (booking) => {
    if (aiReplyBookingId === booking.id) { setAiReplyBookingId(null); return; }
    setAiReplyBookingId(booking.id); setIsGeneratingReply(true); setAiReplyText("");
    const prompt = `Tulis draf mesej WhatsApp balasan mesra untuk pelanggan ${booking.name} yang baru menempah Homestay Bayu. Tarikh: ${booking.checkIn} hingga ${booking.checkOut}. Harga: RM ${booking.totalPrice}. Nota Pelanggan: ${booking.notes || "Tiada"}. Sahkan tempahan dan berikan no akaun Maybank 1234567890 (Homestay Bayu).`;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
      const data = await response.json();
      setAiReplyText(data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, ralat AI.");
    } catch (error) { setAiReplyText("Gagal berhubung dengan AI."); }
    setIsGeneratingReply(false);
  };

  const sortedBookings = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div>
      <h3 className="text-2xl font-bold mb-6 text-stone-800">Senarai Tempahan</h3>
      <div className="overflow-x-auto rounded-xl border border-stone-200">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-stone-50 border-b border-stone-200"><th className="p-4 text-stone-600 text-sm">Tarikh / ID</th><th className="p-4 text-stone-600 text-sm">Pelanggan</th><th className="p-4 text-stone-600 text-sm">Penginapan</th><th className="p-4 text-stone-600 text-sm">Status</th><th className="p-4 text-stone-600 text-sm">Tindakan</th></tr></thead>
          <tbody className="divide-y divide-stone-100">
            {sortedBookings.length === 0 ? (<tr><td colSpan="5" className="p-8 text-center text-stone-400">Tiada tempahan direkodkan.</td></tr>) : (
              sortedBookings.map(b => (
                <tr key={b.id} className="hover:bg-stone-50 transition">
                  <td className="p-4 align-top"><div className="font-medium text-stone-800">{new Date(b.createdAt).toLocaleDateString('ms-MY')}</div><div className="text-xs text-stone-400 font-mono mt-1">{b.id.substring(0,8)}</div></td>
                  <td className="p-4 align-top"><div className="font-bold text-stone-800">{b.name}</div><div className="text-sm text-stone-600 flex items-center mt-1"><Phone size={12} className="mr-1"/> {b.phone}</div><div className="text-xs text-stone-400 mt-1">{b.adults} Dewasa, {b.children} Kanak-kanak</div></td>
                  <td className="p-4 align-top"><div className="text-sm font-medium text-stone-800 bg-stone-100 px-2 py-1 rounded inline-block mb-1">{b.checkIn} - {b.checkOut}</div><div className="text-sm text-stone-600 mt-1">{b.nights} Malam • RM {b.totalPrice}</div></td>
                  <td className="p-4 align-top">{getStatusBadge(b.status)}</td>
                  <td className="p-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      {b.status !== 'confirmed' && <button onClick={() => updateStatus(b.id, 'confirmed')} className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 shadow-sm">Sahkan</button>}
                      {b.status === 'pending' && <button onClick={() => updateStatus(b.id, 'rejected')} className="px-3 py-1.5 bg-rose-600 text-white rounded text-xs font-medium hover:bg-rose-700 shadow-sm">Tolak</button>}
                      <button onClick={() => deleteBooking(b.id)} className="px-3 py-1.5 bg-stone-200 text-stone-600 rounded text-xs font-medium hover:bg-stone-300 border border-stone-300">Padam</button>
                      <button onClick={() => generateAIReply(b)} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded text-xs hover:bg-indigo-100 flex items-center border border-indigo-200 font-medium shadow-sm"><Sparkles size={12} className="mr-1" /> {aiReplyBookingId === b.id ? 'Tutup AI' : 'Balasan AI'}</button>
                    </div>
                    {aiReplyBookingId === b.id && (
                      <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs space-y-2 animate-fade-in">
                         {isGeneratingReply ? (<div className="flex items-center text-indigo-600"><Loader2 size={14} className="animate-spin mr-2"/> Menjana mesej pintar...</div>) : (
                            <><textarea className="w-full h-32 p-2 border border-indigo-200 rounded bg-white text-stone-700 font-sans outline-none" value={aiReplyText} onChange={(e) => setAiReplyText(e.target.value)} />
                               <div className="flex justify-end gap-2"><button onClick={() => { navigator.clipboard.writeText(aiReplyText); alert("Mesej telah berjaya disalin!"); }} className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center font-medium shadow-sm transition"><Copy size={12} className="mr-1"/> Salin Teks</button></div>
                            </>
                         )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminCalendar({ blockedDates, bookings, db }) {
  const [dateToBlock, setDateToBlock] = useState('');
  const handleBlockDate = async (e) => { e.preventDefault(); if (!dateToBlock) return; try { await addDoc(collection(db, COL_BLOCKED_DATES), { date: dateToBlock, createdAt: new Date().toISOString() }); setDateToBlock(''); } catch(e) {} };
  const handleUnblock = async (id) => { try { await deleteDoc(doc(db, COL_BLOCKED_DATES, id)); } catch(e) {} };
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');

  return (
    <div>
      <h3 className="text-2xl font-bold mb-6 text-stone-800">Urus Kalendar</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div>
            <h4 className="font-bold text-lg mb-4 text-stone-800">Sekat Tarikh Manual</h4>
            <form onSubmit={handleBlockDate} className="flex gap-2 mb-6"><input type="date" required value={dateToBlock} onChange={e=>setDateToBlock(e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-lg outline-none" /><button type="submit" className="px-4 py-2 bg-stone-800 text-white rounded-lg font-bold">Sekat</button></form>
            <h5 className="font-bold text-sm mb-3 text-stone-700">Senarai Tarikh Disekat Secara Manual:</h5>
            <ul className="space-y-2 border border-stone-100 rounded-xl overflow-hidden divide-y divide-stone-100">
              {blockedDates.length === 0 ? <li className="p-4 text-stone-400 text-sm">Tiada tarikh disekat.</li> : 
                [...blockedDates].sort((a,b) => a.date > b.date ? 1 : -1).map(b => (
                  <li key={b.id} className="p-4 flex justify-between items-center bg-stone-50"><span className="font-medium text-stone-800">{b.date}</span><button onClick={()=>handleUnblock(b.id)} className="text-rose-500 font-semibold text-sm">Buka Semula</button></li>
                ))
              }
            </ul>
         </div>
         <div>
           <h4 className="font-bold text-lg mb-4 text-stone-800">Jadual Tempahan (Disahkan)</h4>
           <ul className="space-y-3">
             {confirmedBookings.length === 0 ? <p className="text-stone-400 text-sm">Tiada tempahan disahkan.</p> :
               confirmedBookings.sort((a,b)=>a.checkIn > b.checkIn ? 1 : -1).map(b => (
                 <li key={b.id} className="p-4 border-l-4 border-emerald-500 bg-emerald-50/50 rounded-r-xl border-y border-r border-emerald-100">
                   <div className="flex justify-between items-start">
                     <div><div className="font-bold text-stone-800">{b.name}</div><div className="text-sm text-stone-600">{b.phone}</div></div>
                     <div className="text-right"><div className="text-sm font-semibold bg-white px-2 py-1 rounded-md border border-emerald-200 text-emerald-900 shadow-sm">{b.checkIn} - {b.checkOut}</div><div className="text-xs text-stone-500 mt-1">{b.nights} Malam</div></div>
                   </div>
                 </li>
               ))
             }
           </ul>
         </div>
      </div>
    </div>
  );
}

function AdminSettings({ initialSettings, db }) {
  const [formData, setFormData] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault(); setIsSaving(true);
    try { await setDoc(doc(db, COL_SETTINGS, 'main_config'), formData); alert('Berjaya disimpan!'); } catch(e) { alert('Ralat.'); }
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSave} className="max-w-2xl">
      <h3 className="text-2xl font-bold mb-6 text-stone-800">Tetapan Harga & Maklumat</h3>
      <div className="space-y-8">
        <div>
          <h4 className="font-bold text-lg border-b pb-2 mb-4 text-stone-800">Kadar Harga (RM)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div><label className="block text-sm font-medium mb-1">Hari Biasa</label><input required type="number" value={formData.weekdayPrice || 0} onChange={e=>setFormData({...formData, weekdayPrice: Number(e.target.value)})} className="w-full border-gray-300 rounded-lg p-2.5 bg-stone-50 border outline-none" /></div>
            <div><label className="block text-sm font-medium mb-1">Hujung Minggu / Cuti</label><input required type="number" value={formData.weekendPrice || 0} onChange={e=>setFormData({...formData, weekendPrice: Number(e.target.value)})} className="w-full border-gray-300 rounded-lg p-2.5 bg-stone-50 border outline-none" /></div>
            <div><label className="block text-sm font-medium text-amber-700 mb-1">Harga Promosi ({'>'}1 Mlm)</label><input required type="number" value={formData.promoPrice || 0} onChange={e=>setFormData({...formData, promoPrice: Number(e.target.value)})} className="w-full border-amber-300 rounded-lg p-2.5 bg-amber-50 border outline-none" /></div>
          </div>
        </div>
        <div>
          <h4 className="font-bold text-lg border-b pb-2 mb-4 mt-8 text-stone-800">Lokasi & Peta</h4>
           <label className="block text-sm font-medium mb-1">Alamat Penuh Homestay</label><textarea required value={formData.address || ''} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full max-w-md border-gray-300 rounded-lg p-3 bg-stone-50 border h-24 mb-4 outline-none"></textarea>
           <label className="block text-sm font-medium mb-1">Pautan Google Maps</label><input required type="url" value={formData.googleMapsLink || ''} onChange={e=>setFormData({...formData, googleMapsLink: e.target.value})} className="w-full max-w-md border-gray-300 rounded-lg p-2.5 bg-stone-50 border outline-none" />
        </div>
        <button type="submit" disabled={isSaving} className="px-8 py-3 bg-stone-800 text-white rounded-xl font-bold hover:bg-stone-700 disabled:opacity-50">{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
      </div>
    </form>
  );
}

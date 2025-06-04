import { ActivityIcon, Edit3, HeartPulse, HelpCircle, Home, Info, Locate, LocateFixedIcon, MessageCircleQuestion, Notebook, NotebookPen, Phone, Pill, Podcast, Ribbon, ShieldPlus, ShoppingCart, Syringe, TableIcon, Target, Telescope, Users, Waypoints } from "lucide-react";


import user1 from "../public/assets/profile-pictures/user1.jpg";
import user2 from "../public/assets/profile-pictures/user2.jpg";
import user3 from "../public/assets/profile-pictures/user3.jpg";
import user4 from "../public/assets/profile-pictures/user4.jpg";
import user5 from "../public/assets/profile-pictures/user5.jpg";
import user6 from "../public/assets/profile-pictures/user6.jpg";
import SatisfiedClients from "../components/SatisfiedClients";

export const navItems = [
  { label: "Home", href: "https://www.doctorkays.com", iconMapping: <Home className="w-5 h-5 inline mr-2" /> },
  { label: "About Us", href: "https://www.doctorkays.com/about", iconMapping: <Info className="w-5 h-5 inline mr-2" /> },
  { label: "Community Forums", href: "https://www.doctorkays.com/community", iconMapping: <Users className="w-5 h-5 inline mr-2" /> },
  { label: "Blog", href: "https://www.doctorkays.com/blog", iconMapping: <Edit3 className="w-5 h-5 inline mr-2" /> },
  { label: "Shop", href: "/shop", iconMapping: <ShoppingCart className="w-5 h-5 inline mr-2" /> },
  { label: "Contact", href: "https://www.doctorkays.com/contact", iconMapping: <Phone className="w-5 h-5 inline mr-2" /> },
  { label: "FAQs", href: "https://www.doctorkays.com/faqs", iconMapping: <HelpCircle className="w-5 h-5 inline mr-2" /> },
];


export const testimonials = [
  {
    user: "MLS Abimbola",
    company: "United Kingdom",
    image: user1,
    text: "Service is very satisfying.",
  },
  {
    user: "Philadolar",
    company: "Nigeria",
    image: user2,
    text: "Your product or content has been really educative and also fun to watch. Keep it up",
  },
  {
    user: "Oluitan Olumide",
    company: "Nigeria",
    image: user3,
    text: "Doctor kays has been an amazing Doctor since I got to know him.",
  },
  {
    user: "Jeremiah Robert",
    company: "Nigeria",
    image: user4,
    text: "Dr Kays is now a household name in social media space. The people on my space are loving it, to the extent of asking: this Doctor kay's you are always posting is doing very good with the health education. Those tips and reminders are very helpul.",
  },
  {
    user: "Commy-Constance Oko",
    company: "Nigeria",
    image: user5,
    text: "I have learnt so much about personal health and got to know a lot on health matters generally. Thank you so much Dr. Kays for always giving prompt response to my questions.",
  },
  {
    user: "Ezekiel",
    company: "London",
    image: user6,
    text: "Great team and the app is easy to use.",
  },
];

export const features = [
  {
    icon: <Pill />,
    text: "Medicine on the Street (MOS)",
    description:
      "Learn how street medicine is transforming lives and bringing heathcare awareness to communities.",
    url: "https://www.youtube.com/@Doctorkays"
  },
  {
    icon: <LocateFixedIcon />,
    text: "Pharmacies near me",
    description:
      "Doctor Kays website makes it effortless to locate nearest pharmacies, clinics, and laboratories closest to you. Instantly find verified health facilities near you.",
    url: "/nearestpharmacy"
  },
  {
    icon: <Syringe />,
    text: "Clinic Series",
    description:
      "Get valuable health tips and advice from our clinic series. Watch our clinic series videos to stay informed about various health topics and preventive care.",
    url: "https://www.youtube.com/@Doctorkays"
  },
  {
    icon: <ShoppingCart />,
    text: "Merch and Shops",
    description:
      "Explore our exclusive range of health products in Doctor Kays shop. From supplements to wellness kits, find everything you need to support your health journey.",
    url: "/shop"
  },
  {
    icon: <ActivityIcon />,
    text: "Health Nuggets",
    description:
      "Get your weekly dose of health tips with our Health Nuggets series. Simple, actionable advice to help you lead a healthier lifestyle.",
    url: "https://www.instagram.com/doctor_kays"
  },
  {
    icon: <NotebookPen />,
    text: "Book an Appointment",
    description:
      "Ready to take charge of your health? Book an appointment with Doctor Kays today and get personalized care you deserve.",
    url: "/consultation"
  },
];

export const mission = [
  {
    icon: <TableIcon />,
    text: "Mission Statement",
    description:
      "To turn medicine from a head-scratcher into your friendly companion - Relatable, understandable and yes, even a bit fun.",
  },
  {
    icon: <Telescope />,
    text: "Vision",
    description:
      "To spread health knowledge and close the gap in access to affordable healthcare across Africa through innovative telehealth and AI solutions.",
  },
  {
    icon: <Notebook />,
    text: "Core Value",
    description:
      "Excellence, Professionalism, Integrity, Compassion, and Trust.",
  },
  {
    icon: <Waypoints />,
    text: "Connect Users With Healthcare Services",
    description:
      "Creating a system to connect users with the nearest pharmacies, specialists, and laboratory based on reviews and referrals.",
  },
  {
    icon: <Podcast />,
    text: "Expert Talks: Health Tips and From Professionals",
    description:
      "Ensure clients are satisfied with the services provided by leaders and experts in the industry with medical content.",
  },
];

export const faqsCard = [
  {
    id: 1,
    question: "Who is Doctor Kays?",
    answer:
      "Doctor Kays, whose full name is Doctor Olayiwola Babatunde Emmanuel, is a medical professional with a strong commitment to preventive health care and community wellness. He shares his knowledge to empower people to make informed health choices that translate into healthier, fulfilling lives.",
  },
  {
    id: 2,
    question: "What is the mission of Doctor Kays?",
    answer:
      "Doctor Kays is on a quest to make health care more approachable and understandable for everybody. He turns complex medical explanations into interesting stories with a pinch of humor. Doctor Kays ensures that health education is not only informative but also enjoyable.",
  },
  {
    id: 3,
    question: "What services are offered?",
    answer:
      "Doctor Kays provides a wide range of services aimed at increasing health awareness. These include Health Nuggets, which are weekly small tips for wellness; Clinic Series, which is an in-depth exploration of certain health topics; Medicine on the Street, which is an interactive street segment to answer real-life health questions; and personal consultations that offer individualized health advice and counseling.",
  },
  {
    id: 4,
    question: "How is the content presented?",
    answer:
      "Content is provided on YouTube, blogs, podcasts, and social media through creative storytelling, humor, and interactivity. It simplifies complex health topics into ones that are relatable, engaging, and easy to understand. The visuals, creative narration, and interactive formats ensure that audiences can apply the information in their daily lives while being entertained. Through diverse platforms, Doctor Kays effectively reaches a wide audience, creating a very interactive community for health awareness and wellness.",
  },
  {
    id: 5,
    question: "How do I make an appointment?",
    answer:
      "To book an appointment with Doctor Kays, consider visiting the booking section on the website. Full guidelines are provided therein to help you make the appointment regarding your needs and what you would want covered.",
  },
  {
    id: 6,
    question: "What topics are covered?",
    answer:
      "Doctor Kays covers general health, disease prevention, lifestyle changes, and wellness, among many other health-related topics. His content covers areas related to day-to-day living health and other particular medical topics.",
  },
  {
    id: 7,
    question: "How is Doctor Kays unique?",
    answer:
      "What sets Doctor Kays apart is his ability to combine professional medical expertise with humor and storytelling. Such an approach makes learning about health more engaging and helps them remember and apply key health concepts in their daily lives.",
  },
];

export const checklistItems = [
  {
    title: "Licensed Professional Doctor",
    description:
      "At Doctor Kays, your health is in expert hands. Our licensed professional doctor provide top-quality medical care tailored to your needs.",
  },
  {
    title: "How We Operate",
    description:
      "Services may be restricted based on location due to licensing regulations.",
  },
  {
    title: "CAC Registered",
    description:
      "Doctor Kays is proud to be a CAC registered entity, ensuring our operations meet the highest legal and professional standards.",
  },
  {
    title: "Clients Are Satisfied With Our Service",
    description:
      <SatisfiedClients />,
  },
];

export const checkaboutlists = [
  {
    icon: <Ribbon />,
    title: "Medicine on the street",
    description:
      "Follow closely as doctor kays takes you to the streets of Nigeria.",
  },
  {
    icon: <HeartPulse />,
    title: "Clinic Series",
    description:
      "Doctor kays powerful vision: To keep everyone updated on self-preventive medical measures.",
  },
  {
    icon: <ShieldPlus />,
    title: "Health Nuggets",
    description:
      "Astonishing quotes and designs that engages people on how to get along with their health.",
  },
  {
    icon: <NotebookPen />,
    title: "Appointment Booking",
    description:
      "Book an appointment with Doctor kays concerning any medical related issues you are facing.",
  },
];
export const pricingOptions = [
  {
    id: "Blood-Tests-and-Scan-Report",
    title: "Blood Tests and Scan Report",
    originalPrice: "$4",
    price: "$0",
    type: "once",
    features: [
      "Join the Community",
      "Newsletter Subscription",
      "Weekly Health Nugget",
      "Laboratory Interpretation",
      "Free Referral suggestions to nearest pharmacies and diagnostic centers",
    ],
    link: "https://calendly.com/martinsmiracle45/one_time_appointment",
  },
  {
    id: "Silver-Package",
    title: "Silver Package",
    originalPrice: "$9",
    price: "$0",
    type: "10 minutes",
    features: [
      "Consultation is scheduled only on available dates",
      "Join the Community",
      "Newsletter Subscription",
      "Weekly Health Nugget",
      "Consultation Chat, Audio and Video Calls",
      "Free Referral suggestions to nearest pharmacies and diagnostic centers",
      
    ],
    link: "https://calendly.com/martinsmiracle45/one_time_appointment",
  },
  {
    id: "Gold-Package",
    title: "Gold Package",
    originalPrice: "$19",
    price: "$9.5",
    type: "10 minutes",
    features: [
      "Swift consultation within 24hrs",
      "Join the Community",
      "Newsletter Subscription",
      "Weekly Health Nugget",
      "Consultation Chat and Calls",
      "Free Referral suggestions to nearest pharmacies and diagnostic centers",
      
    ],
    link: "https://calendly.com/martinsmiracle45/one_time_appointment",
  },
  
];

export const resourcesLinks = [
  { href: "/blog", text: "Blog" },
  { href: "https://www.doctorkays.com/faqs", text: "FAQs" },
  { href: "https://www.youtube.com/@Doctorkays", text: "MOS" },
  { href: "https://www.youtube.com/@Doctorkays", text: "Clinic Series" },
  { href: "https://www.doctorkays.com/community", text: "Community Forums" },
];

export const platformLinks = [
  { href: "https://www.doctorkays.com/consultation", text: "Consultation" },
  { href: "/shop", text: "Shops and Merch" },
];

export const communityLinks = [
  { href: "https://www.doctorkays.com/about", text: "About us" },
  { href: "https://www.doctorkays.com/contact", text: "Contact Us" },
  { href: "https://www.doctorkays.com/partnership", text: "Become a Sponsor/Collaborate" },
  { href: "https://www.doctorkays.com/projects", text: "Projects" },
  { href: "https://www.doctorkays.com/volunteer", text: "Become a volunteer" },
];

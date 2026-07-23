import { Song } from "./types.js";

export const SONGS: Song[] = [
  { id: "s01", title: "Despacito", artist: "Luis Fonsi ft. Daddy Yankee", genre: "reggaeton", difficulty: "easy", decade: "2010s", hint: "La canción más reproducida de YouTube durante años" },
  { id: "s02", title: "De Música Ligera", artist: "Soda Stereo", genre: "rock", difficulty: "easy", decade: "90s", hint: "Intro de guitarra inconfundible del rock argentino" },
  { id: "s03", title: "Bésame Mucho", artist: "Consuelo Velázquez", genre: "clasico", difficulty: "easy", decade: "40s", hint: "Uno de los boleros más grabados de la historia" },
  { id: "s04", title: "Gasolina", artist: "Daddy Yankee", genre: "reggaeton", difficulty: "easy", decade: "2000s", hint: "Le da hasta abajo a su vehículo" },
  { id: "s05", title: "La Bamba", artist: "Ritchie Valens", genre: "clasico", difficulty: "easy", decade: "50s", hint: "Para bailar se necesita un poco de gracia" },
  { id: "s06", title: "Tusa", artist: "Karol G, Nicki Minaj", genre: "reggaeton", difficulty: "easy", decade: "2010s", hint: "No tiene novio pero se puso más buena" },
  { id: "s07", title: "Rayando el Sol", artist: "Maná", genre: "rock", difficulty: "easy", decade: "90s", hint: "Toca la fibra de los enamorados que no pueden alcanzar a su amor" },
  { id: "s08", title: "Felices los 4", artist: "Maluma", genre: "reggaeton", difficulty: "easy", decade: "2010s", hint: "Si hacen el amor van a ser más que solo amigos" },
  { id: "s09", title: "Lamento Boliviano", artist: "Enanitos Verdes", genre: "rock", difficulty: "easy", decade: "90s", hint: "Me quieren agitar, me incitan a gritar..." },
  { id: "s10", title: "Vivir Mi Vida", artist: "Marc Anthony", genre: "pop_latino", difficulty: "easy", decade: "2010s", hint: "Hay que bailar y reír porque lo malo se va" },

  { id: "s11", title: "La Incondicional", artist: "Luis Miguel", genre: "balada", difficulty: "medium", decade: "90s", hint: "Balada clásica de LuisMi dedicada a alguien que siempre está" },
  { id: "s12", title: "Limón y Sal", artist: "Julieta Venegas", genre: "pop_latino", difficulty: "medium", decade: "2000s", hint: "Te quiero con todo lo contradictorio que sos" },
  { id: "s13", title: "Corazón Partío", artist: "Alejandro Sanz", genre: "pop_latino", difficulty: "medium", decade: "90s", hint: "¿Quién me ha robado el mes de abril?" },
  { id: "s14", title: "Clavado en un Bar", artist: "Maná", genre: "rock", difficulty: "medium", decade: "90s", hint: "Ahogando las penas en un bar porque ella se fue" },
  { id: "s15", title: "Taki Taki", artist: "DJ Snake ft. Ozuna, Cardi B, Selena Gomez", genre: "reggaeton", difficulty: "medium", decade: "2010s", hint: "El ritmo tropical con un flow de DJ internacional" },
  { id: "s16", title: "Matador", artist: "Los Fabulosos Cadillacs", genre: "rock", difficulty: "medium", decade: "90s", hint: "Yo no quiero ser un matador, yo solo quiero ser..." },
  { id: "s17", title: "No Se Me Quita", artist: "Maluma ft. Ricky Martin", genre: "reggaeton", difficulty: "medium", decade: "2020s", hint: "Colaboración explosiva entre Colombia y Puerto Rico" },
  { id: "s18", title: "La Cumbia de los Trapos", artist: "Yerba Brava", genre: "cumbia", difficulty: "medium", decade: "2000s", hint: "Cumbia villera argentina, himno de cancha" },
  { id: "s19", title: "Esa Chica", artist: "Ráfaga", genre: "cumbia", difficulty: "medium", decade: "90s", hint: "Esa chica me vuelve loco con su forma de bailar" },
  { id: "s20", title: "Lo Siento BB:/", artist: "Tainy, Bad Bunny, Julieta Venegas", genre: "reggaeton", difficulty: "medium", decade: "2020s", hint: "Fusión de reggaetón moderno con pop de los 2000s" },
  { id: "s21", title: "El Perdón", artist: "Nicky Jam, Enrique Iglesias", genre: "reggaeton", difficulty: "medium", decade: "2010s", hint: "Pide perdón pero sabe que no merece el regreso" },
  { id: "s22", title: "Por Debajo de la Mesa", artist: "Luis Miguel", genre: "balada", difficulty: "medium", decade: "90s", hint: "Romance secreto contado con la sensualidad de LuisMi" },

  { id: "s23", title: "El Ataque de las Chicas Cocodrilo", artist: "Hombres G", genre: "rock", difficulty: "hard", decade: "80s", hint: "Clásico del pop rock español de los 80" },
  { id: "s24", title: "Puto", artist: "Molotov", genre: "rock", difficulty: "hard", decade: "90s", hint: "Título polémico de una banda mexicana provocadora" },
  { id: "s25", title: "Me Rehúso", artist: "Danny Ocean", genre: "pop_latino", difficulty: "hard", decade: "2010s", hint: "Fenómeno viral venezolano que dio la vuelta al mundo" },
  { id: "s26", title: "Baracunátana", artist: "Aterciopelados", genre: "rock", difficulty: "hard", decade: "90s", hint: "Insulto colombiano hecho canción de rock alternativo" },
  { id: "s27", title: "Una Noche Más", artist: "Jennifer Lopez", genre: "pop_latino", difficulty: "hard", decade: "90s", hint: "Antes de ser JLo internacional, fue bailarina y cantante latina" },
  { id: "s28", title: "Crimen", artist: "Gustavo Cerati", genre: "rock", difficulty: "hard", decade: "2000s", hint: "Obra maestra solista del líder de Soda Stereo" },
  { id: "s29", title: "Somos Pacífico", artist: "ChocQuibTown", genre: "cumbia", difficulty: "hard", decade: "2010s", hint: "Himno del Pacífico colombiano con mezcla de hip hop y folclore" },
  { id: "s30", title: "La Mordidita", artist: "Ricky Martin ft. Yotuel", genre: "pop_latino", difficulty: "hard", decade: "2010s", hint: "Ricky Martin con ritmo cubano y una mordida peligrosa" },
];

export function pickRoundSongs(excludeSongIds: string[] = []): {
  correct: Song;
  distractors: Song[];
} {
  const available = SONGS.filter((s) => !excludeSongIds.includes(s.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);

  const correct = shuffled[0];
  const pool = shuffled.slice(1);

  const sameGenre = pool.filter((s) => s.genre === correct.genre);
  const otherGenre = pool.filter((s) => s.genre !== correct.genre);

  const distractors: Song[] = [];
  for (const s of sameGenre) {
    if (distractors.length < 2) distractors.push(s);
  }
  for (const s of otherGenre) {
    if (distractors.length < 3) distractors.push(s);
  }

  return { correct, distractors: distractors.slice(0, 3).sort(() => Math.random() - 0.5) };
}

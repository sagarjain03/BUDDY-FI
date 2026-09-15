import avengers from '../assets/movies/avengers.png';
import friends from '../assets/movies/friends.png';
import znmd from '../assets/movies/znmd.png';
import titanic from '../assets/movies/titanic.png';
import jazz from '../assets/music/jazz.png';
import pop from '../assets/music/pop.png';
import rap from '../assets/music/rap.png';
import rock from '../assets/music/rock.png';
import exercise from '../assets/toughday/exercise.png';
import meditation from '../assets/toughday/meditation.png';
import powering from '../assets/toughday/powering.png';
import venting from '../assets/toughday/venting.png';
import beach from '../assets/vacation/beach.png';
import city from '../assets/vacation/city.png';
import culture from '../assets/vacation/culture.png';
import mountain from '../assets/vacation/mountain.png';
import bingwatch from '../assets/weekends/bingwatch.png';
import explore from '../assets/weekends/explore.png';
import hangout from '../assets/weekends/hangout.png';
import reading from '../assets/weekends/reading.png';
import face from '../assets/communicate/face.png';
import voice from '../assets/communicate/voice.png';
import text from '../assets/communicate/text.png';
import video from '../assets/communicate/video.png';
import sgcf from '../assets/social/sgcf.png';
import bp from '../assets/social/bp.png';
import one from '../assets/social/one.png';
import diff from '../assets/social/diff.png';

/**
 * Artwork for the seven questions that shipped with the app.
 *
 * Questions now live in the database and can carry their own `imageUrl`; this
 * map is the fallback for the original set, whose images are bundled. New
 * questions should set `imageUrl` rather than being added here.
 */
const BUNDLED = {
  'Romantic Movies': titanic,
  'Adventure/Travel Movies': znmd,
  Comedies: friends,
  'Action/Thriller Movies': avengers,
  'Hanging out with friends': hangout,
  'Exploring new places': explore,
  'Binge-watching TV shows': bingwatch,
  'Reading a good book': reading,
  'Pop Hits': pop,
  Jazz: jazz,
  'Rock/Alternative': rock,
  'Hip-Hop/Rap': rap,
  'In-person hangouts': face,
  'Video Calls': video,
  'Texting/Messaging': text,
  'Voice Notes': voice,
  'Beach Relaxation': beach,
  'Mountain Trekking': mountain,
  'City Exploration': city,
  'Cultural Tour': culture,
  'Venting to a friend': venting,
  'Working out or going for a run': exercise,
  'Meditating or practicing mindfulness': meditation,
  'Powering through with determination': powering,
  'Small gathering with close friends': sgcf,
  'Big parties or events': bp,
  'Quiet one-on-one conversations': one,
  'Hanging out with different groups': diff,
};

export const optionImage = (label) => BUNDLED[label] || null;

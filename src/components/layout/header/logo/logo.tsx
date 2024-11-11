import { Link } from 'react-router-dom';
import LogoVaraChess from './LOGOVARACHESS_TEXT.png'

import './logo.scss';

function Logo() {
  return (
    <Link to="/">
      <img 
        src={LogoVaraChess} 
        alt="Logo Vara Chess"
        className='logo-img'
      />
    </Link>
  );
}

export { Logo };

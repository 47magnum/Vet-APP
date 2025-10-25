import {Link} from "react-router-dom"

export default function Home() {
    return(
<div>
    <h1>
        Home Page
        
    </h1>
    <div>
        <Link to='/add_pet'>
        <button>

        
        <h3>
            add pet
        </h3>
        </button>
        </Link>
    </div>
    <Link to='/inspect'>
        <button>

        
        <h3>
            func1
        </h3>
        </button>
        </Link>
</div>

    )


}
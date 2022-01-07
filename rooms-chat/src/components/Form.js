import React from 'react'

const Form = ({username,onChange,connect}) => {
    return (
        <form>
            <input placeholder="Username" type="text" value={username} onChange={onChange}></input>
            <button type="submit" onClick={connect}>Connect</button>
        </form>
    )
}

export default Form
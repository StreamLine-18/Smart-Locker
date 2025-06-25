export default function LockerCard({ locker } : { locker: any}) {
    return (
        <div className="flex flex-col items-start justify-center h-full p-4 gap-3 bg-white shadow-xl w-full">
            <div className="w-full h-80 mb-4 overflow-hidden rounded-lg">
                <img
                src={locker.imageUrl || "/images/placeholder.png"} // kalo bisa bikin dari tabel di database untuk image url, bisa di parse jadi kode kok cari library luar yaa
                className="w-full h-full object-cover rounded-lg" 
                />
            </div>
                 
            <div>
                <h1 className="text-2xl font-bold text-gray-800">{locker.lockerNumber}</h1>
                <ul>
                    <li>
                        <p>{`Booking Status: ${locker.bookingStatus}`}</p>
                        <p>{`Door Status: ${locker.doorStatus}`}</p>
                        <p>{`Lock Status: ${locker.lockStatus}`}</p>
                        <p>{`Lock Status: ${locker.lockStatus}`}</p>
                    </li>
                </ul>
            </div>
        </div>
    )
}
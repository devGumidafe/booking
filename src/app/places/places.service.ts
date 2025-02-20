import { Injectable } from '@angular/core';
import { Place } from './place.model';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject } from 'rxjs';
import { take, map, tap, delay, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

interface PlaceData {

  availableFrom: string;
  availableTo: string;
  description: string;
  imageUrl: string;
  price: string;
  title: string;
  userId: string;

}

@Injectable({
  providedIn: 'root'
})
export class PlacesService {

  public places = new BehaviorSubject<Place[]>([]);

  /*new Place('p1',
    'Manhattan Mansion',
    'In the heart of New York City',
    'https://www.viajeselcorteingles.es/imagen/es/mic/nueva_york/home/img_mic_nueva_york_home_790x486_02.jpg',
    149.99,
    new Date('2020-11-01'),
    new Date('2021-12-31'),
    'xyz'
  ),
  new Place('p2',
    'San Francisco',
    'In the heart of San Francisco City',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/San_Francisco_from_Twin_Peaks_September_2013_panorama_5_edit.jpg/1000px-San_Francisco_from_Twin_Peaks_September_2013_panorama_5_edit.jpg',
    189.99,
    new Date('2020-11-01'),
    new Date('2021-12-31'),
    'abc'
  ),
  new Place('p3',
    'Los Angeles',
    'In the heart of Los Angeles City',
    'https://www.visittheusa.mx/sites/default/files/styles/hero_l_x2/public/images/hero_media_image/2017-01/Getty_515070156_EDITORIALONLY_LosAngeles_HollywoodBlvd_Web72DPI_0.jpg?itok=z9ThSf2W',
    99.99,
    new Date('2020-11-01'),
    new Date('2021-12-31'),
    'abc'
  )
]);*/

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) { }

  getAllPlaces() {
    return this.places.asObservable();
  }

  fetchPlaces() {
    return this.http.get<{ [key: string]: PlaceData }>(
      'https://booking-c5583-default-rtdb.europe-west1.firebasedatabase.app/offered-places.json'
    )
      .pipe(map(resData => {
        const places = [];
        for (const key in resData) {
          if (resData.hasOwnProperty(key)) {
            places.push(new Place(
              key,
              resData[key].title,
              resData[key].description,
              resData[key].imageUrl,
              +resData[key].price,
              new Date(resData[key].availableFrom),
              new Date(resData[key].availableTo),
              resData[key].userId
            )
            );
          }
        }
        return places;

      }),
        tap(places => {
          this.places.next(places);
        })
      );
  }

  getPlace(id: string) {
    return this.places.pipe(
      take(1),
      map(places => {
        return { ...places.find(p => p.id === id) };
      })
    );
  }

  addPlace(
    title: string,
    description: string,
    price: number,
    dateFrom: Date,
    dateTo: Date
  ) {
    let generatedId: string;
    const newPlace = new Place(Math.random().toString(),
      title, description,
      'https://www.viajeselcorteingles.es/imagen/es/mic/nueva_york/home/img_mic_nueva_york_home_790x486_02.jpg',
      price,
      dateFrom,
      dateTo,
      this.authService.getUserId()
    );
    return this.http.
      post<{ name: string }>('https://booking-c5583-default-rtdb.europe-west1.firebasedatabase.app/offered-places.json',
        { ...newPlace, id: null })
      .pipe(
        switchMap(restData => {
          generatedId = restData.name;
          return this.places;
        }),
        take(1),
        tap(places => {
          newPlace.id = generatedId;
          this.places.next(places.concat(newPlace));
        })
      );

    /*return this.places.pipe(take(1),
      delay(1000),
      tap(places => {
        this.places.next(places.concat(newPlace));
      })
    );*/
  }

  updatePlace(placeId: string, title: string, description: string) {
    return this.places.pipe
      (take(1),
        delay(1000),
        tap(places => {
          const updatePlacedIndex = places.findIndex(pl => pl.id === placeId);
          const updatePlaces = [...places];
          const oldPlace = updatePlaces[updatePlacedIndex];

          updatePlaces[updatePlacedIndex] = new Place(
            oldPlace.id,
            title,
            description,
            oldPlace.imageUrl,
            oldPlace.price,
            oldPlace.availableFrom,
            oldPlace.availableTo,
            oldPlace.userId
          );
          this.places.next(updatePlaces);
        })
      );
  }

}

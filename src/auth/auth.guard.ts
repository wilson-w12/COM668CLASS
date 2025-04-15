import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree
} from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, map, tap } from 'rxjs';
import { PopupNotificationService } from '../services/popup-notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router,private popupService: PopupNotificationService  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.authService.isAuthenticated().pipe(
      map(authenticated => {
        if (!authenticated) {
          return this.router.createUrlTree(['/login']);
        }

        const requiresAdmin = next.data['requiresAdmin'] === true;
        const isAdmin = localStorage.getItem('isAdmin') === 'true';

        if (requiresAdmin && !isAdmin) {
          this.popupService.showError('Unauthorised');
          this.router.navigate([`/home`]);
        }

        return true;
      })
    );
  }
}

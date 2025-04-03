import { Component, OnInit, OnDestroy } from '@angular/core';
import { PopupNotificationService } from '../../services/popup-notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-popup-notification',
  templateUrl: './popup-notification.component.html',
  styleUrls: ['./popup-notification.component.css'],
  standalone: false,
})
export class PopupNotificationComponent implements OnInit, OnDestroy {
  message: string = '';
  type: 'success' | 'error' | 'info' | 'warning' | null = null;
  private notificationSubscription: Subscription | null = null;

  constructor(private popupService: PopupNotificationService) {}

  ngOnInit(): void {
    this.notificationSubscription = this.popupService.notification$.subscribe((notification) => {
      this.message = notification.message;
      this.type = notification.type;
    });
  }

  ngOnDestroy(): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  // Hide the notification
  closeNotification() {
    this.popupService.hideNotification();
  }
}

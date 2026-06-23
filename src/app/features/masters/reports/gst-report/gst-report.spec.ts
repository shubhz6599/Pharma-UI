import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GstReport } from './gst-report';

describe('GstReport', () => {
  let component: GstReport;
  let fixture: ComponentFixture<GstReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GstReport],
    }).compileComponents();

    fixture = TestBed.createComponent(GstReport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

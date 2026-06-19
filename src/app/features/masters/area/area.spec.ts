import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Area } from './area';

describe('Area', () => {
  let component: Area;
  let fixture: ComponentFixture<Area>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Area],
    }).compileComponents();

    fixture = TestBed.createComponent(Area);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

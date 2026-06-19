import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Salesman } from './salesman';

describe('Salesman', () => {
  let component: Salesman;
  let fixture: ComponentFixture<Salesman>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Salesman],
    }).compileComponents();

    fixture = TestBed.createComponent(Salesman);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

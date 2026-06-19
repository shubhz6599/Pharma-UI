import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Firm } from './firm';

describe('Firm', () => {
  let component: Firm;
  let fixture: ComponentFixture<Firm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Firm],
    }).compileComponents();

    fixture = TestBed.createComponent(Firm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

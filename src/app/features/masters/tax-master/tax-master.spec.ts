import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxMaster } from './tax-master';

describe('TaxMaster', () => {
  let component: TaxMaster;
  let fixture: ComponentFixture<TaxMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxMaster],
    }).compileComponents();

    fixture = TestBed.createComponent(TaxMaster);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
